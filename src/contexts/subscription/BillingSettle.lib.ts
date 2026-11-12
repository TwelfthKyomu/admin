import 'server-only';

import { db } from '@/infrastructure/database/client';
import type {
    PaymentWebhookEvent,
    WebhookOutcome,
} from '@/infrastructure/payments/provider';
import { ApplicationError } from '@/shared/api/errors';
import { recordAudit } from '@/contexts/auditLog/AuditLog.lib';
import {
    AuditAction,
    AuditTargetType,
} from '@/contexts/auditLog/AuditLog.types';
import { organizations } from '@/contexts/organization/Organizations.table';
import { PaymentIntentStatus } from '@/contexts/paymentIntent/PaymentIntent.types';
import { addDays } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import {
    type BillingPaymentRecord,
    billingPayments,
} from './BillingPayments.table';
import { BillingPaymentStatus, PLAN_CATALOG } from './Subscription.types';

export const findBillingPayment = async (
    organizationId: string,
    sessionId: string,
): Promise<BillingPaymentRecord> => {
    const [payment] = await db
        .select()
        .from(billingPayments)
        .where(
            and(
                eq(billingPayments.organizationId, organizationId),
                eq(billingPayments.providerSessionId, sessionId),
            ),
        )
        .limit(1);

    if (!payment) throw new ApplicationError('Платёж не найден');

    return payment;
};

export const settleBillingPayment = async (
    event: PaymentWebhookEvent,
): Promise<WebhookOutcome> => {
    const result = await db.transaction(async (tx) => {
        const [payment] = await tx
            .select()
            .from(billingPayments)
            .where(
                eq(billingPayments.providerSessionId, event.providerPaymentId),
            )
            .limit(1)
            .for('update');

        if (!payment || payment.status !== BillingPaymentStatus.PENDING) {
            return null;
        }
        if (event.amount !== undefined && event.amount !== payment.amount) {
            return null;
        }

        if (event.status === PaymentIntentStatus.CANCELLED) {
            await tx
                .update(billingPayments)
                .set({ status: BillingPaymentStatus.CANCELLED })
                .where(eq(billingPayments.id, payment.id));

            return { outcome: 'cancelled' as const, payment };
        }
        if (event.status !== PaymentIntentStatus.SUCCEEDED) return null;

        const [organization] = await tx
            .select({
                plan: organizations.plan,
                planExpiresAt: organizations.planExpiresAt,
            })
            .from(organizations)
            .where(eq(organizations.id, payment.organizationId))
            .limit(1)
            .for('update');

        if (!organization) return null;

        const now = new Date();

        const continues =
            organization.plan === payment.plan &&
            organization.planExpiresAt !== null &&
            organization.planExpiresAt > now;

        const periodStart =
            continues && organization.planExpiresAt
                ? organization.planExpiresAt
                : now;

        const periodEnd = addDays(periodStart, payment.periodDays);

        await tx
            .update(organizations)
            .set({ plan: payment.plan, planExpiresAt: periodEnd })
            .where(eq(organizations.id, payment.organizationId));

        await tx
            .update(billingPayments)
            .set({ status: BillingPaymentStatus.PAID, paidAt: now, periodEnd })
            .where(eq(billingPayments.id, payment.id));

        return { outcome: 'applied' as const, payment, periodEnd };
    });

    if (!result) return 'ignored';

    if (result.outcome === 'applied') {
        await recordAudit({
            organizationId: result.payment.organizationId,
            actorUserId: result.payment.createdBy,
            action: AuditAction.BillingPlanChanged,
            targetType: AuditTargetType.Subscription,
            targetId: result.payment.organizationId,
            summary: `Оплачен тариф «${PLAN_CATALOG[result.payment.plan].label}»`,
            metadata: {
                plan: result.payment.plan,
                amount: result.payment.amount,
                periodEnd: result.periodEnd.toISOString(),
            },
        });
    }

    return result.outcome;
};
