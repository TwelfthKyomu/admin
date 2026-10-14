import * as z from 'zod/mini';
import {
    BILLING_PERIOD_VALUES,
    SUBSCRIPTION_PLAN_VALUES,
} from './Subscription.types';

export const PurchasePlanActionInputSchema = z.object({
    plan: z.enum(SUBSCRIPTION_PLAN_VALUES),
    period: z.enum(BILLING_PERIOD_VALUES),
});
