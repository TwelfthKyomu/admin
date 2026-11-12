import * as z from 'zod/mini';
import {
    BILLING_PERIOD_VALUES,
    SUBSCRIPTION_PLAN_VALUES,
    TEST_BILLING_SESSION_PREFIX,
} from './Subscription.types';

export const PurchasePlanActionInputSchema = z.object({
    plan: z.enum(SUBSCRIPTION_PLAN_VALUES),
    period: z.enum(BILLING_PERIOD_VALUES),
});

const TestSessionIdSchema = z
    .string()
    .check(z.startsWith(TEST_BILLING_SESSION_PREFIX), z.maxLength(64));

export const SyncBillingPaymentActionInputSchema = z.object({
    sessionId: z.string().check(z.minLength(1), z.maxLength(255)),
});

export const CompleteTestBillingPaymentActionInputSchema = z.object({
    sessionId: TestSessionIdSchema,
    paid: z.boolean(),
});
