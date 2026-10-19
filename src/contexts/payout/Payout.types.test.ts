import { describe, expect, it } from 'vitest';
import { calcPayout, payoutCovers } from './Payout.types';

describe('calcPayout', () => {
    it('складывает смены, процент с услуг и доставки', () => {
        expect(
            calcPayout({
                shiftsCount: 5,
                shiftRateAmount: 200_000,
                servicesRevenue: 1_234_567,
                commissionRate: 30,
                deliveriesCount: 4,
                deliveryRateAmount: 15_000,
            }),
        ).toEqual({
            shiftsPay: 1_000_000,
            commissionPay: 370_370,
            deliveriesPay: 60_000,
            totalAmount: 1_430_370,
        });
    });

    it('процент округляется вниз, чтобы не переплатить копейку', () => {
        const { commissionPay } = calcPayout({
            shiftsCount: 0,
            shiftRateAmount: 0,
            servicesRevenue: 1001,
            commissionRate: 50,
            deliveriesCount: 0,
            deliveryRateAmount: 0,
        });

        expect(commissionPay).toBe(500);
    });
});

describe('payoutCovers', () => {
    const payout = {
        periodStart: new Date('2026-10-01'),
        periodEnd: new Date('2026-11-01'),
    };

    it('начало периода входит, конец — нет', () => {
        expect(payoutCovers(payout, new Date('2026-10-01'))).toBe(true);

        expect(payoutCovers(payout, new Date('2026-10-31T23:59:59'))).toBe(
            true,
        );

        expect(payoutCovers(payout, new Date('2026-11-01'))).toBe(false);
    });
});
