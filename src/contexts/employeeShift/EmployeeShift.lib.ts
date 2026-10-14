import 'server-only';

import { db, type Reader, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { ownBookingsEmployeeId } from '@/shared/api/permission';
import { findInProject, insertOne, updateOne } from '@/shared/api/repository';
import {
    courierLoadInWindow,
    moveCourierDeliveries,
} from '@/contexts/delivery/Delivery.lib';
import { findActiveAssignment } from '@/contexts/employeeAssignment/EmployeeAssignment.lib';
import { EmployeeKind } from '@/contexts/employeeAssignment/EmployeeAssignment.types';
import { employeeAssignments } from '@/contexts/employeeAssignment/EmployeeAssignments.table';
import {
    findBookingsLosingShiftCoverage,
    findEmployeeBookings,
} from '@/contexts/order/OrderBooking.lib';
import { lockEmployees } from '@/contexts/organizationMember/OrganizationMember.lib';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { users } from '@/contexts/user/Users.table';
import { addMinutes } from 'date-fns';
import {
    and,
    asc,
    count,
    desc,
    eq,
    gt,
    gte,
    inArray,
    isNull,
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
    type ReplacementShiftView,
    SHIFT_EARLY_START_MINUTES,
    ShiftAction,
    ShiftCancelReason,
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

function findOverlappingShifts(
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

export async function listReplacementShifts(
    projectId: string,
): Promise<ReplacementShiftView[]> {
    const rows = await db
        .select({
            shift: employeeShifts,
            employeeName: users.name,
            kind: employeeAssignments.kind,
        })
        .from(employeeShifts)
        .innerJoin(
            organizationMembers,
            eq(organizationMembers.id, employeeShifts.employeeId),
        )
        .innerJoin(users, eq(users.id, organizationMembers.userId))
        .leftJoin(
            employeeAssignments,
            and(
                eq(employeeAssignments.employeeId, employeeShifts.employeeId),
                eq(employeeAssignments.projectId, employeeShifts.projectId),
                isNull(employeeAssignments.endedAt),
            ),
        )
        .where(
            and(
                eq(employeeShifts.projectId, projectId),
                eq(employeeShifts.seekingReplacement, true),
                eq(employeeShifts.status, ShiftStatus.SCHEDULED),
                gte(employeeShifts.startsAt, new Date()),
            ),
        )
        .orderBy(asc(employeeShifts.startsAt));

    return Promise.all(
        rows.map(async ({ shift, employeeName, kind }) => {
            const [bookings, load] = await Promise.all([
                findEmployeeBookings(db, shift),
                courierLoadInWindow(shift),
            ]);

            return {
                ...shift,
                employeeName,
                kind: kind ?? EmployeeKind.SPECIALIST,
                bookingsCount: bookings.length,
                deliveriesCount: load.count,
                cashDue: load.cashDue,
            };
        }),
    );
}

export async function assertShiftAccess(
    userId: string,
    shift: EmployeeShiftRecord,
): Promise<{ fullAccess: boolean }> {
    const ownEmployeeId = await ownBookingsEmployeeId(userId, shift.projectId);

    if (ownEmployeeId && shift.employeeId !== ownEmployeeId) {
        throw new ApplicationError('Смена принадлежит другому сотруднику');
    }

    return { fullAccess: ownEmployeeId === null };
}

async function assertShiftDroppable(shift: EmployeeShiftRecord): Promise<void> {
    const orphaned = await findBookingsLosingShiftCoverage(shift);

    if (orphaned.length > 0) {
        throw new ApplicationError(
            `На это время назначены активные записи (${orphaned.length} шт.), которые больше ничем не покрыты. Перенесите их или передайте смену другому сотруднику.`,
        );
    }
}

async function assertShiftWindowFree(
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

async function planShiftStart(
    shift: EmployeeShiftRecord,
    at: Date,
): Promise<Partial<NewEmployeeShiftRecord>> {
    if (shift.status !== ShiftStatus.SCHEDULED) {
        throw new ApplicationError('Начать можно только запланированную смену');
    }
    if (at < addMinutes(shift.startsAt, -SHIFT_EARLY_START_MINUTES)) {
        throw new ApplicationError(
            `Начать смену можно не раньше чем за ${SHIFT_EARLY_START_MINUTES} мин до её начала`,
        );
    }
    if (at >= shift.endsAt) {
        throw new ApplicationError(
            'Смена уже закончилась — отметьте её завершённой',
        );
    }

    if (at < shift.startsAt) {
        await assertShiftWindowFree(shift, {
            startsAt: at,
            endsAt: shift.endsAt,
        });

        return { status: ShiftStatus.IN_PROGRESS, startsAt: at };
    }

    return { status: ShiftStatus.IN_PROGRESS };
}

async function planShiftComplete(
    shift: EmployeeShiftRecord,
    at: Date,
    fullAccess: boolean,
): Promise<Partial<NewEmployeeShiftRecord>> {
    const completable =
        shift.status === ShiftStatus.IN_PROGRESS ||
        (fullAccess && shift.status === ShiftStatus.SCHEDULED);

    if (!completable) {
        throw new ApplicationError(
            fullAccess
                ? 'Завершить можно только идущую или запланированную смену'
                : 'Сначала начните смену',
        );
    }
    if (at <= shift.startsAt) {
        throw new ApplicationError('Нельзя завершить смену до её начала');
    }

    if (at > shift.endsAt) {
        await assertShiftWindowFree(shift, {
            startsAt: shift.startsAt,
            endsAt: at,
        });

        return { status: ShiftStatus.COMPLETED, endsAt: at };
    }

    return { status: ShiftStatus.COMPLETED };
}

async function planShiftCancel(
    shift: EmployeeShiftRecord,
    cancelReason?: ShiftCancelReason,
): Promise<Partial<NewEmployeeShiftRecord>> {
    if (!OPEN_SHIFT_STATUSES.includes(shift.status)) {
        throw new ApplicationError(
            'Отменить можно только запланированную или идущую смену',
        );
    }

    await assertShiftDroppable(shift);

    return {
        status: ShiftStatus.CANCELLED,
        cancelReason: cancelReason ?? null,
        seekingReplacement: false,
    };
}

async function planShiftNoShow(
    shift: EmployeeShiftRecord,
    at: Date,
    fullAccess: boolean,
): Promise<Partial<NewEmployeeShiftRecord>> {
    if (!fullAccess) {
        throw new ApplicationError(
            'Отметить неявку может только администратор расписания',
        );
    }
    if (shift.status !== ShiftStatus.SCHEDULED) {
        throw new ApplicationError(
            'Отметить неявку можно только для запланированной смены',
        );
    }
    if (at < shift.startsAt) {
        throw new ApplicationError(
            'Неявку можно отметить только после начала смены',
        );
    }

    await assertShiftDroppable(shift);

    return { status: ShiftStatus.NO_SHOW, seekingReplacement: false };
}

export function planShiftStatusChange(
    shift: EmployeeShiftRecord,
    change: {
        action: ShiftAction;
        at: Date;
        fullAccess: boolean;
        cancelReason?: ShiftCancelReason;
    },
): Promise<Partial<NewEmployeeShiftRecord>> {
    switch (change.action) {
        case ShiftAction.START:
            return planShiftStart(shift, change.at);
        case ShiftAction.COMPLETE:
            return planShiftComplete(shift, change.at, change.fullAccess);
        case ShiftAction.CANCEL:
            return planShiftCancel(shift, change.cancelReason);
        case ShiftAction.NO_SHOW:
            return planShiftNoShow(shift, change.at, change.fullAccess);
    }
}

export function updateShiftStatus(
    shift: EmployeeShiftRecord,
    patch: Partial<NewEmployeeShiftRecord>,
    executor?: Tx,
): Promise<EmployeeShiftRecord> {
    return updateOne(
        employeeShifts,
        and(
            eq(employeeShifts.id, shift.id),
            eq(employeeShifts.status, shift.status),
        ),
        patch,
        'Смена изменилась в другом окне — обновите страницу',
        executor,
    );
}

async function assertEligibleSubstitute(
    shift: EmployeeShiftRecord,
    substituteId: string,
): Promise<void> {
    if (shift.employeeId === substituteId) {
        throw new ApplicationError(
            'Замещающий совпадает с текущим сотрудником',
        );
    }

    const [[substitute], active, [original]] = await Promise.all([
        db
            .select({ id: organizationMembers.id })
            .from(organizationMembers)
            .where(
                and(
                    eq(organizationMembers.id, substituteId),
                    eq(
                        organizationMembers.organizationId,
                        shift.organizationId,
                    ),
                    isNull(organizationMembers.leftAt),
                ),
            )
            .limit(1),
        findActiveAssignment(substituteId, shift.projectId),
        db
            .select({ kind: employeeAssignments.kind })
            .from(employeeAssignments)
            .where(
                and(
                    eq(employeeAssignments.employeeId, shift.employeeId),
                    eq(employeeAssignments.projectId, shift.projectId),
                ),
            )
            .orderBy(desc(employeeAssignments.startedAt))
            .limit(1),
    ]);

    if (!substitute) {
        throw new ApplicationError('Замещающий сотрудник не найден');
    }
    if (!active) {
        throw new ApplicationError(
            'У замещающего нет активного назначения на этот проект',
        );
    }
    if (original && original.kind !== active.kind) {
        throw new ApplicationError(
            'Заменить можно только сотрудником того же вида работы: курьера — курьером, мастера — мастером',
        );
    }
}

export async function replaceShiftEmployee(
    shift: EmployeeShiftRecord,
    substituteId: string,
    input: { note: string; byUserId: string },
): Promise<{ shift: EmployeeShiftRecord; transferredDeliveries: number }> {
    if (!OPEN_SHIFT_STATUSES.includes(shift.status)) {
        throw new ApplicationError(
            'Заменить можно только активную (запланированную или текущую) смену',
        );
    }

    await assertEligibleSubstitute(shift, substituteId);

    return db.transaction(async (tx) => {
        await lockEmployees(tx, [substituteId]);

        const busy = await findOverlappingShifts(tx, {
            employeeId: substituteId,
            startsAt: shift.startsAt,
            endsAt: shift.endsAt,
        });

        if (busy.length > 0) {
            throw new ApplicationError(
                'У замещающего уже есть смена, пересекающаяся с этим окном',
            );
        }

        await updateShiftStatus(
            shift,
            {
                status: ShiftStatus.CANCELLED,
                cancelReason: ShiftCancelReason.REPLACED,
                seekingReplacement: false,
            },
            tx,
        );

        const created = await insertOne(
            employeeShifts,
            {
                employeeId: substituteId,
                projectId: shift.projectId,
                organizationId: shift.organizationId,
                startsAt: shift.startsAt,
                endsAt: shift.endsAt,
                breakMinutes: shift.breakMinutes,
                notes: input.note,
            },
            'Не удалось создать смену для замены',
            tx,
        );

        const transferredDeliveries = await moveCourierDeliveries(tx, {
            ...shift,
            toEmployeeId: substituteId,
            byUserId: input.byUserId,
        });

        return { shift: created, transferredDeliveries };
    });
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
