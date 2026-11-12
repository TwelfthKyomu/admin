'use server';

import {
    organizationMemberAction,
    organizationMutationAction,
} from '@/shared/api/action-client';
import { recordAudit } from '@/contexts/auditLog/AuditLog.lib';
import {
    AuditAction,
    AuditTargetType,
} from '@/contexts/auditLog/AuditLog.types';
import { Permission } from '@/contexts/user/User.types';
import { completeTestBillingPayment } from './BillingTest.lib';
import { getOrganizationSubscriptionStatus } from './Subscription.lib';
import {
    CompleteTestBillingPaymentActionInputSchema,
    PurchasePlanActionInputSchema,
    SyncBillingPaymentActionInputSchema,
} from './Subscription.schema';
import { type BillingCheckout, SubscriptionPlan } from './Subscription.types';
import {
    startPlanCheckout,
    switchToFreePlan,
    syncBillingPayment,
} from './SubscriptionBilling.lib';

export const subscriptionStatusAction = organizationMemberAction().action(
    ({ ctx: { organizationId } }) =>
        getOrganizationSubscriptionStatus(organizationId),
);

export type PurchasePlanResult = { mode: 'direct' } | BillingCheckout;

export const purchasePlanAction = organizationMutationAction(
    Permission.MANAGE_BILLING,
    'billing',
)
    .inputSchema(PurchasePlanActionInputSchema)
    .action(
        async ({
            parsedInput: { plan, period },
            ctx: { userId, organizationId },
        }): Promise<PurchasePlanResult> => {
            if (plan !== SubscriptionPlan.FREE) {
                return startPlanCheckout({
                    organizationId,
                    plan,
                    period,
                    userId,
                });
            }

            await switchToFreePlan(organizationId);

            await recordAudit({
                organizationId,
                actorUserId: userId,
                action: AuditAction.BillingPlanChanged,
                targetType: AuditTargetType.Subscription,
                targetId: organizationId,
                summary: 'Тариф изменён на «Free»',
                metadata: { plan },
            });

            return { mode: 'direct' };
        },
    );

export const syncBillingPaymentAction = organizationMutationAction(
    Permission.MANAGE_BILLING,
    'billing',
)
    .inputSchema(SyncBillingPaymentActionInputSchema)
    .action(
        async ({ parsedInput: { sessionId }, ctx: { organizationId } }) => ({
            outcome: await syncBillingPayment(organizationId, sessionId),
        }),
    );

export const completeTestBillingPaymentAction = organizationMutationAction(
    Permission.MANAGE_BILLING,
    'billing',
)
    .inputSchema(CompleteTestBillingPaymentActionInputSchema)
    .action(
        async ({
            parsedInput: { sessionId, paid },
            ctx: { organizationId },
        }) => ({
            outcome: await completeTestBillingPayment(
                organizationId,
                sessionId,
                paid,
            ),
        }),
    );
