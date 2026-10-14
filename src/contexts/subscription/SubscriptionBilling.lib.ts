import 'server-only';

import { db } from '@/infrastructure/database/client';
import type { WebhookOutcome } from '@/infrastructure/payments/provider';
import {
    toWebhookEvent,
    withStripeErrors,
} from '@/infrastructure/payments/stripe';
import { ApplicationError } from '@/shared/api/errors';
import { ROUTES } from '@/shared/constants';
import { DEFAULT_CURRENCY } from '@/shared/constants/currency';
import { recordAudit } from '@/contexts/auditLog/AuditLog.lib';
import {
    AuditAction,
    AuditTargetType,
} from '@/contexts/auditLog/AuditLog.types';
import { organizations } from '@/contexts/organization/Organizations.table';
import { PaymentIntentStatus } from '@/contexts/paymentIntent/PaymentIntent.types';
import { products } from '@/contexts/product/Products.table';
import { countOrganizationProjects } from '@/contexts/project/Project.lib';
import { projects } from '@/contexts/project/Projects.table';
import { projectBadges } from '@/contexts/projectBadge/ProjectBadges.table';
import { env } from '@/env';
import { addDays } from 'date-fns';
import { and, count, eq, isNull } from 'drizzle-orm';
import Stripe from 'stripe';
import { billingPayments } from './BillingPayments.table';
import { billingKeys } from './Subscription.lib';
import {
    BILLING_PERIOD_DAYS,
    BILLING_PERIOD_LABEL,
    BillingPaymentStatus,
    type BillingPeriod,
    LIMITS_BY_PLAN,
    PLAN_CATALOG,
    SubscriptionPlan,
} from './Subscription.types';

async function assertFitsPlan(
    organizationId: string,
    plan: SubscriptionPlan,
): Promise<void> {
    const limits = LIMITS_BY_PLAN[plan];

    const alive = and(
        eq(projects.organizationId, organizationId),
        isNull(projects.deletedAt),
    );

    const [projectsCount, productRows, badgeRows] = await Promise.all([
        countOrganizationProjects(organizationId),
        db
            .select({ value: count() })
            .from(products)
            .innerJoin(projects, eq(projects.id, products.projectId))
            .where(and(alive, isNull(products.deletedAt)))
            .groupBy(products.projectId),
        db
            .select({ value: count() })
            .from(projectBadges)
            .innerJoin(projects, eq(projects.id, projectBadges.projectId))
            .where(and(alive, isNull(projectBadges.deletedAt)))
            .groupBy(projectBadges.projectId),
    ]);

    const maxOf = (rows: { value: number }[]) =>
        rows.reduce((top, row) => Math.max(top, row.value), 0);

    const excess = [
        projectsCount > limits.projects &&
            `проектов ${projectsCount} при лимите ${limits.projects}`,
        maxOf(productRows) > limits.productsPerProject &&
            `товаров в проекте до ${maxOf(productRows)} при лимите ${limits.productsPerProject}`,
        maxOf(badgeRows) > limits.badgesPerProject &&
            `бейджей в проекте до ${maxOf(badgeRows)} при лимите ${limits.badgesPerProject}`,
    ].filter(Boolean);

    if (excess.length > 0) {
        throw new ApplicationError(
            `Нельзя перейти на «${PLAN_CATALOG[plan].label}»: ${excess.join('; ')}. Сначала уберите лишнее.`,
        );
    }
}

export async function switchToFreePlan(organizationId: string): Promise<void> {
    await assertFitsPlan(organizationId, SubscriptionPlan.FREE);

    await db
        .update(organizations)
        .set({ plan: SubscriptionPlan.FREE, planExpiresAt: null })
        .where(eq(organizations.id, organizationId));
}

export async function startPlanCheckout(input: {
    organizationId: string;
    plan: SubscriptionPlan;
    period: BillingPeriod;
    userId: string;
}): Promise<string> {
    const keys = billingKeys();

    if (!keys) {
        throw new ApplicationError(
            'Оплата тарифов ещё не настроена. Обратитесь к администратору платформы.',
        );
    }

    const { label } = PLAN_CATALOG[input.plan];
    const price = PLAN_CATALOG[input.plan].price[input.period];

    if (price <= 0) throw new ApplicationError('Этот тариф не оплачивается');

    await assertFitsPlan(input.organizationId, input.plan);

    const billingUrl = `${env.NEXT_PUBLIC_APP_URL}${ROUTES.billing}`;

    const session = await withStripeErrors(
        new Stripe(keys.secretKey).checkout.sessions.create({
            mode: 'payment',
            client_reference_id: input.organizationId,
            success_url: `${billingUrl}?paid=1`,
            cancel_url: billingUrl,
            line_items: [
                {
                    quantity: 1,
                    price_data: {
                        currency: DEFAULT_CURRENCY.toLowerCase(),
                        unit_amount: price,
                        product_data: {
                            name: `Тариф ${label} на ${BILLING_PERIOD_LABEL[input.period]}`,
                        },
                    },
                },
            ],
            metadata: {
                organizationId: input.organizationId,
                plan: input.plan,
            },
        }),
    );

    if (!session.url) {
        throw new ApplicationError('Stripe не вернул ссылку на оплату');
    }

    await db.insert(billingPayments).values({
        organizationId: input.organizationId,
        plan: input.plan,
        amount: price,
        periodDays: BILLING_PERIOD_DAYS[input.period],
        currency: DEFAULT_CURRENCY,
        providerSessionId: session.id,
        createdBy: input.userId,
    });

    return session.url;
}

export async function applyBillingWebhook(
    rawBody: string,
    signature: string | undefined,
): Promise<WebhookOutcome> {
    const keys = billingKeys();

    if (!keys) throw new ApplicationError('Оплата тарифов не настроена');

    const event = toWebhookEvent(
        new Stripe(keys.secretKey).webhooks.constructEvent(
            rawBody,
            signature ?? '',
            keys.webhookSecret,
        ),
    );

    if (!event.providerPaymentId) return 'ignored';

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
}
