import { describe, expect, it } from 'vitest';
import {
    assertCouponRedeemable,
    assertDiscountValue,
    assertValidRange,
    CouponDiscountType,
    CouponStatus,
    computeDiscount,
} from './Coupon.types';

describe('computeDiscount', () => {
    it('процент округляется вниз до копейки', () => {
        expect(
            computeDiscount(
                {
                    discountType: CouponDiscountType.PERCENTAGE,
                    discountValue: 15,
                },
                999,
            ),
        ).toBe(149);
    });

    it('фиксированная скидка не больше суммы', () => {
        expect(
            computeDiscount(
                {
                    discountType: CouponDiscountType.FIXED_AMOUNT,
                    discountValue: 50_000,
                },
                30_000,
            ),
        ).toBe(30_000);
    });

    it('100% — бесплатно, но не в минус', () => {
        expect(
            computeDiscount(
                {
                    discountType: CouponDiscountType.PERCENTAGE,
                    discountValue: 100,
                },
                12_345,
            ),
        ).toBe(12_345);
    });
});

describe('assertCouponRedeemable', () => {
    const now = new Date('2026-06-15T12:00:00Z');

    const active = {
        status: CouponStatus.ACTIVE,
        validFrom: null,
        validUntil: null,
        maxUses: null,
        usesCount: 0,
    };

    it('активный бессрочный купон проходит', () => {
        expect(() => assertCouponRedeemable(active, now)).not.toThrow();
    });

    it('выключенный купон не применяется', () => {
        expect(() =>
            assertCouponRedeemable(
                { ...active, status: CouponStatus.INACTIVE },
                now,
            ),
        ).toThrow('Купон неактивен');
    });

    it('проверяет период действия', () => {
        expect(() =>
            assertCouponRedeemable(
                { ...active, validFrom: new Date('2026-07-01') },
                now,
            ),
        ).toThrow('ещё не действует');

        expect(() =>
            assertCouponRedeemable(
                { ...active, validUntil: new Date('2026-06-01') },
                now,
            ),
        ).toThrow('истёк');
    });

    it('исчерпанный лимит', () => {
        expect(() =>
            assertCouponRedeemable(
                { ...active, maxUses: 3, usesCount: 3 },
                now,
            ),
        ).toThrow('лимит');
    });
});

describe('валидация полей купона', () => {
    it('процент больше 100 запрещён, сумма — нет', () => {
        expect(() =>
            assertDiscountValue(CouponDiscountType.PERCENTAGE, 101),
        ).toThrow();

        expect(() =>
            assertDiscountValue(CouponDiscountType.FIXED_AMOUNT, 101),
        ).not.toThrow();
    });

    it('начало не позже конца', () => {
        expect(() =>
            assertValidRange(new Date('2026-02-01'), new Date('2026-01-01')),
        ).toThrow();

        expect(() =>
            assertValidRange(new Date('2026-01-01'), null),
        ).not.toThrow();
    });
});
