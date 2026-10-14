import type {
    CloseCashShiftActionInputSchema,
    OpenCashShiftActionInputSchema,
    RecordCashCollectionActionInputSchema,
} from '@/contexts/cashShift';
import * as z from 'zod/mini';

export type OpenCashShiftFormValues = z.input<
    typeof OpenCashShiftActionInputSchema
>;

export type RecordCashCollectionFormValues = z.input<
    typeof RecordCashCollectionActionInputSchema
>;

export type CloseCashShiftFormValues = z.input<
    typeof CloseCashShiftActionInputSchema
>;

export const AcceptCourierCashFormSchema = z.object({
    amount: z.nullable(z.number()),
});

export type AcceptCourierCashFormValues = z.input<
    typeof AcceptCourierCashFormSchema
>;
