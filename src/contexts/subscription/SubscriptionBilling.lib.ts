import 'server-only';

import { db } from '@/infrastructure/database/client';
import type { WebhookOutcome } from '@/infrastructure/payments/provider';
import { ApplicationError } from '@/shared/api/errors';
import { ROUTES } from '@/shared/constants';
import { DEFAULT_CURRENCY } from '@/shared/constants/currency';
import { organizations } from '@/contexts/organization/Organizations.table';
import { PaymentIntentStatus } from '@/contexts/paymentIntent/PaymentIntent.types';
import { products } from '@/contexts/product/Products.table';
import { countOrganizationProjects } from '@/contexts/project/Project.lib';
import { projects } from '@/contexts/project/Projects.table';
import { projectBadges } from '@/contexts/projectBadge/ProjectBadges.table';
import { env } from '@/env';
import { and, count, eq, isNull } from 'drizzle-orm';
import { billingPayments } from './BillingPayments.table';
import { findBillingPayment, settleBillingPayment } from './BillingSettle.lib';
import {
    createStripeCheckout,
    parseStripeBillingWebhook,
    retrieveStripeBillingEvent,
} from './BillingStripe.lib';
import { createTestCheckout } from './BillingTest.lib';
import {
    createYookassaCheckout,
    parseYookassaBillingWebhook,
} from './BillingYookassa.lib';
import { billingProvider } from './Subscription.lib';
import {
    BILLING_PERIOD_DAYS,
    BILLING_PERIOD_LABEL,
    type BillingCheckout,
    type BillingCheckoutInput,
    type BillingPeriod,
    BillingProvider,
    LIMITS_BY_PLAN,
    PLAN_CATALOG,
    SubscriptionPlan,
} from './Subscription.types';

const CHECKOUT_BY_PROVIDER: Record<
    BillingProvider,
    (input: BillingCheckoutInput) => Promise<BillingCheckout>
> = {
    [BillingProvider.TEST]: createTestCheckout,
    [BillingProvider.STRIPE]: createStripeCheckout,
    [BillingProvider.YOOKASSA]: createYookassaCheckout,
};

const assertFitsPlan = async (
    organizationId: string,
    plan: SubscriptionPlan,
): Promise<void> => {
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
};

export const switchToFreePlan = async (
    organizationId: string,
): Promise<void> => {
    await assertFitsPlan(organizationId, SubscriptionPlan.FREE);

    await db
        .update(organizations)
        .set({ plan: SubscriptionPlan.FREE, planExpiresAt: null })
        .where(eq(organizations.id, organizationId));
};

export const startPlanCheckout = async (input: {
    organizationId: string;
    plan: SubscriptionPlan;
    period: BillingPeriod;
    userId: string;
}): Promise<BillingCheckout> => {
    const { label } = PLAN_CATALOG[input.plan];
    const price = PLAN_CATALOG[input.plan].price[input.period];

    if (price <= 0) throw new ApplicationError('Этот тариф не оплачивается');

    await assertFitsPlan(input.organizationId, input.plan);

    const checkout = await CHECKOUT_BY_PROVIDER[billingProvider()]({
        organizationId: input.organizationId,
        plan: input.plan,
        amount: price,
        description: `Тариф ${label} на ${BILLING_PERIOD_LABEL[input.period]}`,
        billingUrl: `${env.NEXT_PUBLIC_APP_URL}${ROUTES.billing}`,
    });

    await db.insert(billingPayments).values({
        organizationId: input.organizationId,
        plan: input.plan,
        amount: price,
        periodDays: BILLING_PERIOD_DAYS[input.period],
        currency: DEFAULT_CURRENCY,
        providerSessionId: checkout.sessionId,
        createdBy: input.userId,
    });

    return checkout;
};

export const syncBillingPayment = async (
    organizationId: string,
    sessionId: string,
): Promise<WebhookOutcome> => {
    await findBillingPayment(organizationId, sessionId);

    if (billingProvider() !== BillingProvider.STRIPE) return 'ignored';

    const event = await retrieveStripeBillingEvent(sessionId);

    if (event.status === PaymentIntentStatus.PENDING) return 'ignored';

    return settleBillingPayment(event);
};

export const applyBillingWebhook = async (
    rawBody: string,
    signature: string | null,
): Promise<WebhookOutcome> => {
    const provider = billingProvider();

    if (provider === BillingProvider.TEST) return 'ignored';

    const event =
        provider === BillingProvider.STRIPE
            ? parseStripeBillingWebhook(rawBody, signature)
            : await parseYookassaBillingWebhook(rawBody);

    if (!event.providerPaymentId) return 'ignored';

    return settleBillingPayment(event);
};
