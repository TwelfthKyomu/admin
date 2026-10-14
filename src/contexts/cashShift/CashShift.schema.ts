import { NOTE_MAX } from '@/shared/constants/default';
import { idSchema } from '@/shared/validation';
import { projectScopeSchema } from '@/shared/validation/base';
import * as z from 'zod/mini';

export const OpenCashShiftActionInputSchema = z.object({
    projectId: idSchema,

    openingAmount: z.nullish(z.int().check(z.gte(0))),
});

export const CloseCashShiftActionInputSchema = z.object({
    projectId: idSchema,

    countedAmount: z.nullish(z.int().check(z.gte(0))),
    note: z.optional(z.string().check(z.trim(), z.maxLength(NOTE_MAX))),
});

export const RecordCashCollectionActionInputSchema = z.object({
    projectId: idSchema,
    amount: z.int().check(z.positive()),
    note: z.optional(z.string().check(z.trim(), z.maxLength(NOTE_MAX))),
});

export const CashRegisterSummaryActionInputSchema = projectScopeSchema;

export const AcceptCourierCashActionInputSchema = z.object({
    projectId: idSchema,
    employeeId: idSchema,
    amount: z.int().check(z.positive()),
});
