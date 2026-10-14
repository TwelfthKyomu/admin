import {
    CouponDiscountType,
    CouponStatus,
    CreateCouponActionInputSchema,
    UpdateCouponActionInputSchema,
} from '@/contexts/coupon';
import * as z from 'zod/mini';

export const COUPON_DEFAULT = {
    code: '',
    label: '',
    discountType: CouponDiscountType.PERCENTAGE,
    status: CouponStatus.ACTIVE,
};

function percentCap(data: {
    discountType?: CouponDiscountType;
    discountValue?: number;
}) {
    return (
        data.discountType !== CouponDiscountType.PERCENTAGE ||
        data.discountValue === undefined ||
        data.discountValue <= 100
    );
}

const PERCENT_CAP_PARAMS = {
    error: 'Процент скидки не может превышать 100',
    path: ['discountValue'],
};

export const CreateCouponFormSchema = CreateCouponActionInputSchema.check(
    z.refine(percentCap, PERCENT_CAP_PARAMS),
);

export const UpdateCouponFormSchema = UpdateCouponActionInputSchema.check(
    z.refine(percentCap, PERCENT_CAP_PARAMS),
);

export type CreateCouponFormValues = z.input<typeof CreateCouponFormSchema>;

export type UpdateCouponFormValues = z.input<typeof UpdateCouponFormSchema>;
