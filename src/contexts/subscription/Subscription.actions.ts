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
import { getOrganizationSubscriptionStatus } from './Subscription.lib';
import { PurchasePlanActionInputSchema } from './Subscription.schema';
import { SubscriptionPlan } from './Subscription.types';
import { startPlanCheckout, switchToFreePlan } from './SubscriptionBilling.lib';

export const subscriptionStatusAction = organizationMemberAction().action(
    ({ ctx: { organizationId } }) =>
        getOrganizationSubscriptionStatus(organizationId),
);

export type PurchasePlanResult =
    | { mode: 'direct' }
    | { mode: 'redirect'; url: string };

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
                return {
                    mode: 'redirect',
                    url: await startPlanCheckout({
                        organizationId,
                        plan,
                        period,
                        userId,
                    }),
                };
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
