import {
    CODE_MAX,
    DESCRIPTION_LONG_MAX,
    LABEL_MAX,
    NAME_MAX,
    PHONE_MAX,
} from '@/shared/constants/default';
import { idSchema } from '@/shared/validation/base';
import {
    ORDER_ITEM_QUANTITY_MAX,
    ORDER_ITEMS_MAX,
} from '@/contexts/order/Order.types';
import * as z from 'zod/mini';

const EmailSchema = z.pipe(
    z.string().check(z.trim(), z.toLowerCase()),
    z.email().check(z.maxLength(LABEL_MAX)),
);

const StorefrontItemsSchema = z
    .array(
        z.object({
            productId: idSchema,
            variantId: z.optional(idSchema),
            quantity: z.int().check(z.gte(1), z.lte(ORDER_ITEM_QUANTITY_MAX)),
        }),
    )
    .check(z.minLength(1), z.maxLength(ORDER_ITEMS_MAX));

export const StorefrontOrderInputSchema = z
    .object({
        customerName: z
            .string()
            .check(z.trim(), z.minLength(1), z.maxLength(LABEL_MAX)),
        customerEmail: z.optional(EmailSchema),
        customerPhone: z.optional(
            z.string().check(z.trim(), z.minLength(1), z.maxLength(PHONE_MAX)),
        ),
        items: StorefrontItemsSchema,
        couponCode: z.optional(
            z.string().check(z.trim(), z.maxLength(CODE_MAX)),
        ),
        notes: z.optional(z.string().check(z.maxLength(DESCRIPTION_LONG_MAX))),
        payment: z.optional(z.object({ returnUrl: z.url() })),
    })
    .check(
        z.refine(
            (input) => Boolean(input.customerEmail || input.customerPhone),
            {
                error: 'Укажите email или телефон покупателя',
                path: ['customerPhone'],
            },
        ),
    );

export type StorefrontOrderInput = z.output<typeof StorefrontOrderInputSchema>;

export const StorefrontCouponPreviewInputSchema = z.object({
    code: z.string().check(z.trim(), z.minLength(1), z.maxLength(CODE_MAX)),
    items: StorefrontItemsSchema,
});

export type StorefrontCouponPreviewInput = z.output<
    typeof StorefrontCouponPreviewInputSchema
>;

export const StorefrontRegisterInputSchema = z.object({
    firstName: z
        .string()
        .check(z.trim(), z.minLength(1), z.maxLength(NAME_MAX)),
    lastName: z.optional(z.string().check(z.trim(), z.maxLength(NAME_MAX))),
    email: EmailSchema,
    password: z.string().check(z.minLength(8), z.maxLength(128)),
});

export const StorefrontVerifyInputSchema = z.object({
    email: EmailSchema,
    code: z
        .string()
        .check(z.trim(), z.regex(/^\d{6}$/, 'Введите 6-значный код')),
});

export const StorefrontLoginInputSchema = z.object({
    email: EmailSchema,
    password: z.string().check(z.minLength(1), z.maxLength(128)),
});

export const StorefrontPasswordForgotInputSchema = z.object({
    email: EmailSchema,
});

export const StorefrontPasswordResetInputSchema = z.object({
    email: EmailSchema,
    code: StorefrontVerifyInputSchema.shape.code,
    password: StorefrontRegisterInputSchema.shape.password,
});

export type StorefrontRegisterInput = z.output<
    typeof StorefrontRegisterInputSchema
>;
export type StorefrontVerifyInput = z.output<
    typeof StorefrontVerifyInputSchema
>;
export type StorefrontLoginInput = z.output<typeof StorefrontLoginInputSchema>;
export type StorefrontPasswordForgotInput = z.output<
    typeof StorefrontPasswordForgotInputSchema
>;
export type StorefrontPasswordResetInput = z.output<
    typeof StorefrontPasswordResetInputSchema
>;
