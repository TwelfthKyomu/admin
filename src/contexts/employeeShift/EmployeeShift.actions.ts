'use server';

import { db } from '@/infrastructure/database/client';
import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import {
    assertFullBookingsAccess,
    visibleBookingsEmployeeId,
} from '@/shared/api/permission';
import { updateOne } from '@/shared/api/repository';
import { employeeAssignments } from '@/contexts/employeeAssignment/EmployeeAssignments.table';
import { reassignBookings } from '@/contexts/order/OrderBooking.lib';
import {
    SHIFT_READ_PERMISSIONS,
    SHIFT_WRITE_PERMISSIONS,
} from '@/contexts/user/User.types';
import { and, asc, eq, gte, inArray, isNull, lt } from 'drizzle-orm';
import {
    assertShiftAccess,
    findShiftInProject,
    insertShiftsWithoutOverlaps,
    listReplacementShifts,
    planShiftStatusChange,
    replaceShiftEmployee,
    updateShiftStatus,
} from './EmployeeShift.lib';
import {
    BulkCreateShiftsActionInputSchema,
    ChangeShiftStatusActionInputSchema,
    ReassignShiftActionInputSchema,
    ReplacementShiftsActionInputSchema,
    SetShiftSeekingReplacementActionInputSchema,
    ShiftsActionInputSchema,
} from './EmployeeShift.schema';
import {
    ShiftStatus,
    type SkippedShiftView,
    shiftWindowError,
    skippedShift,
} from './EmployeeShift.types';
import {
    employeeShifts,
    type NewEmployeeShiftRecord,
} from './EmployeeShifts.table';

export const shiftsAction = projectReadAction(SHIFT_READ_PERMISSIONS)
    .inputSchema(ShiftsActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        const ownEmployeeId = await visibleBookingsEmployeeId(
            userId,
            parsedInput.projectId,
        );

        return db
            .select()
            .from(employeeShifts)
            .where(
                and(
                    eq(employeeShifts.projectId, parsedInput.projectId),
                    ownEmployeeId
                        ? eq(employeeShifts.employeeId, ownEmployeeId)
                        : undefined,
                    parsedInput.employeeId
                        ? eq(employeeShifts.employeeId, parsedInput.employeeId)
                        : undefined,
                    parsedInput.from
                        ? gte(employeeShifts.startsAt, parsedInput.from)
                        : undefined,
                    parsedInput.to
                        ? lt(employeeShifts.startsAt, parsedInput.to)
                        : undefined,
                    parsedInput.statuses?.length
                        ? inArray(employeeShifts.status, parsedInput.statuses)
                        : undefined,
                ),
            )
            .orderBy(asc(employeeShifts.startsAt));
    });

export const replacementShiftsAction = projectReadAction(SHIFT_READ_PERMISSIONS)
    .inputSchema(ReplacementShiftsActionInputSchema)
    .action(({ parsedInput: { projectId } }) =>
        listReplacementShifts(projectId),
    );

export const bulkCreateShiftsAction = projectMutationAction(
    SHIFT_WRITE_PERMISSIONS,
)
    .inputSchema(BulkCreateShiftsActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        const { projectId } = parsedInput;

        const employeeIds = [
            ...new Set(parsedInput.shifts.map((shift) => shift.employeeId)),
        ];

        const [, assignments] = await Promise.all([
            assertFullBookingsAccess(userId, projectId),
            db
                .select({
                    employeeId: employeeAssignments.employeeId,
                    organizationId: employeeAssignments.organizationId,
                })
                .from(employeeAssignments)
                .where(
                    and(
                        inArray(employeeAssignments.employeeId, employeeIds),
                        eq(employeeAssignments.projectId, projectId),
                        isNull(employeeAssignments.endedAt),
                    ),
                ),
        ]);

        const orgByEmployee = new Map(
            assignments.map((row) => [row.employeeId, row.organizationId]),
        );

        const drafts: NewEmployeeShiftRecord[] = [];
        const skipped: SkippedShiftView[] = [];

        for (const input of parsedInput.shifts) {
            const organizationId = orgByEmployee.get(input.employeeId);

            if (!organizationId) {
                skipped.push(skippedShift(input, 'no_active_assignment'));
                continue;
            }

            const draft = {
                employeeId: input.employeeId,
                projectId,
                organizationId,
                startsAt: input.startsAt,
                endsAt: input.endsAt,
                breakMinutes: input.breakMinutes ?? 0,
                notes: input.notes ?? null,
            };

            const windowError = shiftWindowError(draft);

            if (windowError) skipped.push(skippedShift(input, windowError));
            else drafts.push(draft);
        }

        const { created, overlapping } = await db.transaction((tx) =>
            insertShiftsWithoutOverlaps(tx, drafts),
        );

        return {
            created,
            skipped: [
                ...skipped,
                ...overlapping.map((draft) =>
                    skippedShift(draft, 'overlaps_existing_shift'),
                ),
            ],
        };
    });

export const changeShiftStatusAction = projectMutationAction(
    SHIFT_WRITE_PERMISSIONS,
)
    .inputSchema(ChangeShiftStatusActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        const shift = await findShiftInProject(
            parsedInput.id,
            parsedInput.projectId,
        );

        const { fullAccess } = await assertShiftAccess(userId, shift);

        const patch = await planShiftStatusChange(shift, {
            action: parsedInput.action,
            at: fullAccess ? (parsedInput.at ?? new Date()) : new Date(),
            fullAccess,
            cancelReason: parsedInput.cancelReason,
        });

        return updateShiftStatus(shift, patch);
    });

export const setShiftSeekingReplacementAction = projectMutationAction(
    SHIFT_WRITE_PERMISSIONS,
)
    .inputSchema(SetShiftSeekingReplacementActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        const shift = await findShiftInProject(
            parsedInput.id,
            parsedInput.projectId,
        );

        await assertShiftAccess(userId, shift);

        if (parsedInput.seeking && shift.status !== ShiftStatus.SCHEDULED) {
            throw new ApplicationError(
                'Искать замену можно только для запланированной смены',
            );
        }

        return updateOne(
            employeeShifts,
            eq(employeeShifts.id, shift.id),
            { seekingReplacement: parsedInput.seeking },
            'Смена не найдена',
        );
    });

export const reassignShiftAction = projectMutationAction(
    SHIFT_WRITE_PERMISSIONS,
)
    .inputSchema(ReassignShiftActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        const [, shift] = await Promise.all([
            assertFullBookingsAccess(userId, parsedInput.projectId),
            findShiftInProject(parsedInput.id, parsedInput.projectId),
        ]);

        const replaced = await replaceShiftEmployee(
            shift,
            parsedInput.substituteEmployeeId,
            {
                note: parsedInput.reason ?? 'Замена сотрудника',
                byUserId: userId,
            },
        );

        const bookings = await reassignBookings(
            shift,
            parsedInput.substituteEmployeeId,
            userId,
        );

        return {
            newShift: replaced.shift,
            transferredBookings: bookings.transferred,
            transferredDeliveries: replaced.transferredDeliveries,
            skippedBookings: bookings.skipped,
        };
    });
