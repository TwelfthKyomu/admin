import { db as testDb } from '@/infrastructure/database/client';
import { seedProject } from '@/infrastructure/database/testSeed';
import { insertOne } from '@/shared/api/repository';
import { DEFAULT_CURRENCY } from '@/shared/constants/currency';
import { organizations } from '@/contexts/organization/Organizations.table';
import { PaymentIntentStatus } from '@/contexts/paymentIntent/PaymentIntent.types';
import { differenceInCalendarDays } from 'date-fns';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { billingPayments } from './BillingPayments.table';
import { settleBillingPayment } from './BillingSettle.lib';
import { BillingPaymentStatus, SubscriptionPlan } from './Subscription.types';

vi.mock('@/infrastructure/database/client', async () => {
    const { createTestDb } = await import('@/infrastructure/database/testDb');

    return { db: await createTestDb() };
});

const AMOUNT = 99_000;

let shop: Awaited<ReturnType<typeof seedProject>>;

beforeEach(async () => {
    shop = await seedProject();
});

const createPayment = () => {
    return insertOne(
        billingPayments,
        {
            organizationId: shop.organization.id,
            plan: SubscriptionPlan.PRO,
            amount: AMOUNT,
            periodDays: 30,
            currency: DEFAULT_CURRENCY,
            providerSessionId: `test_${crypto.randomUUID()}`,
            createdBy: shop.user.id,
        },
        'Не удалось создать платёж',
    );
};

const paid = (providerPaymentId: string, amount = AMOUNT) => {
    return settleBillingPayment({
        providerPaymentId,
        status: PaymentIntentStatus.SUCCEEDED,
        amount,
    });
};

const organizationPlan = async () => {
    const [row] = await testDb
        .select({
            plan: organizations.plan,
            planExpiresAt: organizations.planExpiresAt,
        })
        .from(organizations)
        .where(eq(organizations.id, shop.organization.id));

    return row;
};

describe('оплата тарифа', () => {
    it('включает тариф на срок платежа', async () => {
        const payment = await createPayment();

        expect(await paid(payment.providerSessionId)).toBe('applied');

        const plan = await organizationPlan();

        expect(plan?.plan).toBe(SubscriptionPlan.PRO);

        expect(
            differenceInCalendarDays(
                plan?.planExpiresAt ?? new Date(),
                new Date(),
            ),
        ).toBe(30);
    });

    it('продление прибавляет срок к текущему', async () => {
        const first = await createPayment();
        const second = await createPayment();

        await paid(first.providerSessionId);
        await paid(second.providerSessionId);

        const plan = await organizationPlan();

        expect(
            differenceInCalendarDays(
                plan?.planExpiresAt ?? new Date(),
                new Date(),
            ),
        ).toBe(60);
    });

    it('не применяет оплату с другой суммой и повторное уведомление', async () => {
        const payment = await createPayment();

        expect(await paid(payment.providerSessionId, AMOUNT - 1)).toBe(
            'ignored',
        );

        expect(await paid(payment.providerSessionId)).toBe('applied');
        expect(await paid(payment.providerSessionId)).toBe('ignored');
    });

    it('отмена закрывает платёж без тарифа', async () => {
        const payment = await createPayment();

        const outcome = await settleBillingPayment({
            providerPaymentId: payment.providerSessionId,
            status: PaymentIntentStatus.CANCELLED,
        });

        const [row] = await testDb
            .select({ status: billingPayments.status })
            .from(billingPayments)
            .where(eq(billingPayments.id, payment.id));

        expect(outcome).toBe('cancelled');
        expect(row?.status).toBe(BillingPaymentStatus.CANCELLED);
        expect((await organizationPlan())?.plan).toBe(SubscriptionPlan.FREE);
    });
});
