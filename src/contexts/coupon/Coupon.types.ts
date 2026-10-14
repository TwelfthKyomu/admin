import { ApplicationError } from '@/shared/api/errors';
import { enumValues } from '@/shared/lib/enum';
import type { CouponRecord } from './Coupons.table';

export const CouponDiscountType = {
    PERCENTAGE: 'percentage',
    FIXED_AMOUNT: 'fixed_amount',
} as const;

export type CouponDiscountType =
    (typeof CouponDiscountType)[keyof typeof CouponDiscountType];

export const COUPON_DISCOUNT_TYPE_VALUES = enumValues(CouponDiscountType);

export const CouponStatus = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;

export type CouponStatus = (typeof CouponStatus)[keyof typeof CouponStatus];

export const COUPON_STATUS_VALUES = enumValues(CouponStatus);

export type CouponScopeRule =
    | { type: 'category'; categoryId: string }
    | { type: 'product'; productId: string };

export interface CouponScope {
    rules: CouponScopeRule[];
}

export const COUPON_SCOPE_RULES_MAX = 50;

export function normalizeCouponCode(code: string): string {
    return code.toUpperCase().trim();
}

export function splitCouponScope(scope: CouponScope | undefined): {
    productIds: string[];
    categoryIds: string[];
} {
    const rules = scope?.rules ?? [];

    return {
        productIds: rules.flatMap((rule) =>
            rule.type === 'product' ? [rule.productId] : [],
        ),
        categoryIds: rules.flatMap((rule) =>
            rule.type === 'category' ? [rule.categoryId] : [],
        ),
    };
}

export function computeDiscount(
    coupon: Pick<CouponRecord, 'discountType' | 'discountValue'>,
    subtotalAmount: number,
): number {
    const discount =
        coupon.discountType === CouponDiscountType.PERCENTAGE
            ? Math.floor((subtotalAmount * coupon.discountValue) / 100)
            : coupon.discountValue;

    return Math.min(subtotalAmount, discount);
}

export function assertDiscountValue(
    discountType: CouponDiscountType,
    discountValue: number,
): void {
    if (discountType === CouponDiscountType.PERCENTAGE && discountValue > 100) {
        throw new ApplicationError('Процент скидки не может превышать 100');
    }
}

export function assertValidRange(
    validFrom: Date | null,
    validUntil: Date | null,
): void {
    if (validFrom && validUntil && validFrom > validUntil) {
        throw new ApplicationError(
            'Дата начала должна быть не позже даты окончания',
        );
    }
}

export function assertCouponRedeemable(
    coupon: Pick<
        CouponRecord,
        'status' | 'validFrom' | 'validUntil' | 'maxUses' | 'usesCount'
    >,
    now: Date,
): void {
    if (coupon.status !== CouponStatus.ACTIVE) {
        throw new ApplicationError('Купон неактивен');
    }
    if (coupon.validFrom && now < coupon.validFrom) {
        throw new ApplicationError('Купон ещё не действует');
    }
    if (coupon.validUntil && now > coupon.validUntil) {
        throw new ApplicationError('Срок действия купона истёк');
    }
    if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
        throw new ApplicationError('Достигнут лимит использований купона');
    }
}
