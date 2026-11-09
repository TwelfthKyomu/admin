import 'server-only';

import { db, type Reader, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { ownShiftsEmployeeId } from '@/shared/api/permission';
import { findInProject } from '@/shared/api/repository';
import { lockEmployees } from '@/contexts/organizationMember/OrganizationMember.lib';
import {
    and,
    asc,
    count,
    eq,
    gt,
    gte,
    inArray,
    lt,
    lte,
    ne,
    or,
} from 'drizzle-orm';
import {
    type EmployeeWindow,
    type MyShiftView,
    OPEN_SHIFT_STATUSES,
    overlaps,
    ShiftStatus,
    WORKING_SHIFT_STATUSES,
} from './EmployeeShift.types';
import {
    type EmployeeShiftRecord,
    employeeShifts,
    type NewEmployeeShiftRecord,
} from './EmployeeShifts.table';

export function findShiftInProject(
    id: string,
    projectId: string,
): Promise<EmployeeShiftRecord> {
    return findInProject(employeeShifts, id, projectId, 'Смена не найдена');
}

export function findOverlappingShifts(
    executor: Reader,
    window: Omit<EmployeeWindow, 'projectId'> & { excludeShiftId?: string },
): Promise<EmployeeShiftRecord[]> {
    return executor
        .select()
        .from(employeeShifts)
        .where(
            and(
                eq(employeeShifts.employeeId, window.employeeId),
                inArray(employeeShifts.status, WORKING_SHIFT_STATUSES),
                lt(employeeShifts.startsAt, window.endsAt),
                gt(employeeShifts.endsAt, window.startsAt),
                window.excludeShiftId
                    ? ne(employeeShifts.id, window.excludeShiftId)
                    : undefined,
            ),
        )
        .orderBy(asc(employeeShifts.startsAt));
}

export async function insertShiftsWithoutOverlaps(
    tx: Tx,
    drafts: NewEmployeeShiftRecord[],
): Promise<{
    created: EmployeeShiftRecord[];
    overlapping: NewEmployeeShiftRecord[];
}> {
    if (drafts.length === 0) return { created: [], overlapping: [] };

    const employeeIds = [...new Set(drafts.map((draft) => draft.employeeId))];

    await lockEmployees(tx, employeeIds);

    const from = Math.min(...drafts.map((draft) => draft.startsAt.getTime()));
    const to = Math.max(...drafts.map((draft) => draft.endsAt.getTime()));

    const busy = await tx
        .select({
            employeeId: employeeShifts.employeeId,
            startsAt: employeeShifts.startsAt,
            endsAt: employeeShifts.endsAt,
        })
        .from(employeeShifts)
        .where(
            and(
                inArray(employeeShifts.employeeId, employeeIds),
                inArray(employeeShifts.status, WORKING_SHIFT_STATUSES),
                lt(employeeShifts.startsAt, new Date(to)),
                gt(employeeShifts.endsAt, new Date(from)),
            ),
        );

    const accepted: NewEmployeeShiftRecord[] = [];
    const overlapping: NewEmployeeShiftRecord[] = [];

    for (const draft of drafts) {
        const clashes = (
            shift: Pick<
                EmployeeShiftRecord,
                'employeeId' | 'startsAt' | 'endsAt'
            >,
        ) => shift.employeeId === draft.employeeId && overlaps(shift, draft);

        const taken = busy.some(clashes) || accepted.some(clashes);

        if (taken) overlapping.push(draft);
        else accepted.push(draft);
    }

    const created =
        accepted.length > 0
            ? await tx.insert(employeeShifts).values(accepted).returning()
            : [];

    return { created, overlapping };
}

export function aggregateWorkedShiftsByEmployee(
    projectId: string,
    from: Date,
    to: Date,
): Promise<{ employeeId: string; count: number }[]> {
    return db
        .select({ employeeId: employeeShifts.employeeId, count: count() })
        .from(employeeShifts)
        .where(
            and(
                eq(employeeShifts.projectId, projectId),
                gte(employeeShifts.startsAt, from),
                lt(employeeShifts.startsAt, to),
                or(
                    eq(employeeShifts.status, ShiftStatus.COMPLETED),
                    and(
                        inArray(employeeShifts.status, OPEN_SHIFT_STATUSES),
                        lte(employeeShifts.endsAt, new Date()),
                    ),
                ),
            ),
        )
        .groupBy(employeeShifts.employeeId);
}

export async function isCoveredByShift(
    executor: Reader,
    window: EmployeeWindow,
): Promise<boolean> {
    const [shift] = await executor
        .select({ id: employeeShifts.id })
        .from(employeeShifts)
        .where(
            and(
                eq(employeeShifts.employeeId, window.employeeId),
                eq(employeeShifts.projectId, window.projectId),
                inArray(employeeShifts.status, WORKING_SHIFT_STATUSES),
                lte(employeeShifts.startsAt, window.startsAt),
                gte(employeeShifts.endsAt, window.endsAt),
            ),
        )
        .limit(1);

    return shift !== undefined;
}

export async function assertShiftAccess(
    userId: string,
    shift: EmployeeShiftRecord,
): Promise<{ fullAccess: boolean }> {
    const ownEmployeeId = await ownShiftsEmployeeId(userId, shift.projectId);

    if (ownEmployeeId && shift.employeeId !== ownEmployeeId) {
        throw new ApplicationError('Смена принадлежит другому сотруднику');
    }

    return { fullAccess: ownEmployeeId === null };
}

export async function assertShiftWindowFree(
    shift: EmployeeShiftRecord,
    window: Pick<EmployeeShiftRecord, 'startsAt' | 'endsAt'>,
): Promise<void> {
    const overlapping = await findOverlappingShifts(db, {
        employeeId: shift.employeeId,
        startsAt: window.startsAt,
        endsAt: window.endsAt,
        excludeShiftId: shift.id,
    });

    if (overlapping.length > 0) {
        throw new ApplicationError(
            'Смена в новых границах пересекается с другой сменой сотрудника',
        );
    }
}

export function listEmployeeShiftsBetween(
    employeeId: string,
    from: Date,
    to: Date,
): Promise<MyShiftView[]> {
    return db
        .select({
            id: employeeShifts.id,
            projectId: employeeShifts.projectId,
            startsAt: employeeShifts.startsAt,
            endsAt: employeeShifts.endsAt,
            status: employeeShifts.status,
        })
        .from(employeeShifts)
        .where(
            and(
                eq(employeeShifts.employeeId, employeeId),
                lt(employeeShifts.startsAt, to),
                gt(employeeShifts.endsAt, from),
                ne(employeeShifts.status, ShiftStatus.CANCELLED),
            ),
        )
        .orderBy(asc(employeeShifts.startsAt));
}
