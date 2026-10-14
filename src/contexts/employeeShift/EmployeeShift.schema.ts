import {
    DESCRIPTION_SHORT_MAX,
    PAGE_SIZE_LIMIT,
    REASON_MAX,
} from '@/shared/constants/default';
import {
    idSchema,
    nonNegativeIntSchema,
    projectScopeSchema,
} from '@/shared/validation/base';
import * as z from 'zod/mini';
import {
    SHIFT_ACTION_VALUES,
    SHIFT_CANCEL_REASON_VALUES,
    SHIFT_STATUS_VALUES,
} from './EmployeeShift.types';

export const ShiftsActionInputSchema = z.object({
    projectId: idSchema,
    from: z.optional(z.coerce.date()),
    to: z.optional(z.coerce.date()),
    employeeId: z.optional(idSchema),
    statuses: z.optional(z.array(z.enum(SHIFT_STATUS_VALUES))),
});

export const BulkCreateShiftsActionInputSchema = z.object({
    projectId: idSchema,
    shifts: z
        .array(
            z.object({
                employeeId: idSchema,
                startsAt: z.coerce.date(),
                endsAt: z.coerce.date(),
                breakMinutes: z.optional(nonNegativeIntSchema),
                notes: z.optional(
                    z.string().check(z.maxLength(DESCRIPTION_SHORT_MAX)),
                ),
            }),
        )
        .check(z.minLength(1), z.maxLength(PAGE_SIZE_LIMIT)),
});

export const ChangeShiftStatusActionInputSchema = z.object({
    id: idSchema,
    projectId: idSchema,
    action: z.enum(SHIFT_ACTION_VALUES),
    at: z.optional(z.coerce.date()),

    cancelReason: z.optional(z.enum(SHIFT_CANCEL_REASON_VALUES)),
});

export const SetShiftSeekingReplacementActionInputSchema = z.object({
    id: idSchema,
    projectId: idSchema,
    seeking: z.boolean(),
});

export const ReplacementShiftsActionInputSchema = projectScopeSchema;

export const ReassignShiftActionInputSchema = z.object({
    id: idSchema,
    projectId: idSchema,
    substituteEmployeeId: idSchema,
    reason: z.optional(z.string().check(z.trim(), z.maxLength(REASON_MAX))),
});
