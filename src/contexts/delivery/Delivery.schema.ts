import {
    idSchema,
    moneyAmountSchema,
    positiveIntSchema,
} from '@/shared/validation/base';
import { PaymentMethod } from '@/contexts/payment/Payment.types';
import * as z from 'zod/mini';
import {
    CARRIER_SETTABLE_STATUSES,
    DELIVERY_ADDRESS_MAX,
    DELIVERY_CARRIER_VALUES,
    DELIVERY_REASON_MAX,
    DeliveryKind,
} from './Delivery.types';

const text = (max: number) => z.string().check(z.trim(), z.maxLength(max));

const requiredText = (max: number) =>
    z.string().check(z.trim(), z.minLength(1), z.maxLength(max));

const CourierFieldsSchema = {
    address: requiredText(DELIVERY_ADDRESS_MAX),
    recipientName: z.nullish(text(255)),
    recipientPhone: z.nullish(text(32)),
    windowStart: z.coerce.date(),
    windowEnd: z.coerce.date(),
    cashDue: z.optional(moneyAmountSchema),
};

const CarrierFieldsSchema = {
    carrier: z.enum(DELIVERY_CARRIER_VALUES),
    trackingNumber: requiredText(120),
    address: z.nullish(text(DELIVERY_ADDRESS_MAX)),
};

export const DeliveriesActionInputSchema = z.object({
    projectId: idSchema,
    from: z.optional(z.coerce.date()),
    to: z.optional(z.coerce.date()),
});

export const CourierStatsActionInputSchema = z.object({
    projectId: idSchema,
    from: z.coerce.date(),
    to: z.coerce.date(),
});

export const OrderDeliveryActionInputSchema = z.object({
    projectId: idSchema,
    orderId: idSchema,
});

export const CreateDeliveryActionInputSchema = z.discriminatedUnion('kind', [
    z.object({
        projectId: idSchema,
        orderId: idSchema,
        kind: z.literal(DeliveryKind.COURIER),
        courierId: z.optional(idSchema),
        ...CourierFieldsSchema,
    }),
    z.object({
        projectId: idSchema,
        orderId: idSchema,
        kind: z.literal(DeliveryKind.CARRIER),
        ...CarrierFieldsSchema,
    }),
]);

export const UpdateDeliveryActionInputSchema = z.object({
    projectId: idSchema,
    id: idSchema,
    address: z.optional(text(DELIVERY_ADDRESS_MAX)),
    recipientName: z.nullish(text(255)),
    recipientPhone: z.nullish(text(32)),
    windowStart: z.optional(z.coerce.date()),
    windowEnd: z.optional(z.coerce.date()),
    cashDue: z.optional(moneyAmountSchema),
    carrier: z.optional(z.enum(DELIVERY_CARRIER_VALUES)),
    trackingNumber: z.optional(requiredText(120)),
});

export const AssignDeliveryActionInputSchema = z.object({
    projectId: idSchema,
    id: idSchema,
    courierId: idSchema,
});

export const DeliveryRefActionInputSchema = z.object({
    projectId: idSchema,
    id: idSchema,
});

export const CompleteDeliveryActionInputSchema = z.object({
    projectId: idSchema,
    id: idSchema,
    payment: z.optional(
        z.object({
            amount: positiveIntSchema,
            method: z.enum([PaymentMethod.CASH, PaymentMethod.CARD]),
        }),
    ),
});

export const FailDeliveryActionInputSchema = z.object({
    projectId: idSchema,
    id: idSchema,
    reason: requiredText(DELIVERY_REASON_MAX),
});

export const SetCarrierStatusActionInputSchema = z.object({
    projectId: idSchema,
    id: idSchema,
    status: z.enum(CARRIER_SETTABLE_STATUSES),
});
