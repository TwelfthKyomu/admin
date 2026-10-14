import { CODE_MAX, LABEL_MAX } from '@/shared/constants/default';
import { textField, upperCodeField } from '@/shared/validation';
import {
    entityInProjectSchema,
    idSchema,
    moneyAmountSchema,
    positiveIntSchema,
    projectScopeSchema,
} from '@/shared/validation/base';
import * as z from 'zod/mini';
import {
    COUPON_DISCOUNT_TYPE_VALUES,
    COUPON_SCOPE_RULES_MAX,
    COUPON_STATUS_VALUES,
} from './Coupon.types';

const CODE_MIN = 3;

const CodeSchema = upperCodeField(CODE_MAX, CODE_MIN);
const LabelSchema = textField(LABEL_MAX);

const CouponScopeRuleSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('category'), categoryId: idSchema }),
    z.object({ type: z.literal('product'), productId: idSchema }),
]);

const CouponScopeSchema = z.object({
    rules: z
        .array(CouponScopeRuleSchema)
        .check(z.maxLength(COUPON_SCOPE_RULES_MAX)),
});

const CouponFieldsSchema = z.object({
    code: CodeSchema,
    label: LabelSchema,
    discountType: z.enum(COUPON_DISCOUNT_TYPE_VALUES),
    discountValue: positiveIntSchema,
    scope: z.optional(CouponScopeSchema),
    status: z.optional(z.enum(COUPON_STATUS_VALUES)),
    validFrom: z.nullish(z.coerce.date()),
    validUntil: z.nullish(z.coerce.date()),
    maxUses: z.nullish(positiveIntSchema),
    maxUsesPerClient: z.nullish(positiveIntSchema),
    minOrderAmount: z.nullish(moneyAmountSchema),
});

export const CreateCouponActionInputSchema = z.extend(CouponFieldsSchema, {
    projectId: idSchema,
});

export const UpdateCouponActionInputSchema = z.extend(
    z.partial(CouponFieldsSchema),
    { id: idSchema, projectId: idSchema },
);

export const DeleteCouponActionInputSchema = entityInProjectSchema;

export const CouponsActionInputSchema = projectScopeSchema;

export const RedeemCouponActionInputSchema = z.object({
    projectId: idSchema,
    orderId: idSchema,
    code: textField(CODE_MAX),
});
