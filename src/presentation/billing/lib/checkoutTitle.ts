import {
    BILLING_PERIOD_LABEL,
    type BillingPeriod,
    PLAN_CATALOG,
    type SubscriptionPlan,
} from '@/contexts/subscription';

export const checkoutTitle = (
    plan: SubscriptionPlan,
    period: BillingPeriod,
): string => {
    return `Тариф ${PLAN_CATALOG[plan].label} на ${BILLING_PERIOD_LABEL[period]}`;
};
