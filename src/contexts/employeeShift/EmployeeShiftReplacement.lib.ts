import 'server-only';

import { db } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { insertOne } from '@/shared/api/repository';
import { moveCourierDeliveries } from '@/contexts/delivery/Delivery.lib';
import { courierLoadInWindow } from '@/contexts/delivery/DeliveryCourier.lib';
import { findActiveAssignment } from '@/contexts/employeeAssignment/EmployeeAssignment.lib';
import { EmployeeKind } from '@/contexts/employeeAssignment/EmployeeAssignment.types';
import { employeeAssignments } from '@/contexts/employeeAssignment/EmployeeAssignments.table';
import { lockEmployees } from '@/contexts/organizationMember/OrganizationMember.lib';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { users } from '@/contexts/user/Users.table';
import { and, asc, desc, eq, gte, isNull } from 'drizzle-orm';
import { findOverlappingShifts } from './EmployeeShift.lib';
import {
    OPEN_SHIFT_STATUSES,
    type ReplacementShiftView,
    ShiftCancelReason,
    ShiftStatus,
} from './EmployeeShift.types';
import { updateShiftStatus } from './EmployeeShiftStatus.lib';
import {
    type EmployeeShiftRecord,
    employeeShifts,
} from './EmployeeShifts.table';

export const listReplacementShifts = async (
    projectId: string,
): Promise<ReplacementShiftView[]> => {
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
            const load = await courierLoadInWindow(shift);

            return {
                ...shift,
                employeeName,
                kind: kind ?? EmployeeKind.SPECIALIST,
                deliveriesCount: load.count,
                cashDue: load.cashDue,
            };
        }),
    );
};

const assertEligibleSubstitute = async (
    shift: EmployeeShiftRecord,
    substituteId: string,
): Promise<void> => {
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
            'Заменить можно только сотрудником того же вида работы',
        );
    }
};

export const replaceShiftEmployee = async (
    shift: EmployeeShiftRecord,
    substituteId: string,
    input: { note: string; byUserId: string },
): Promise<{ shift: EmployeeShiftRecord; transferredDeliveries: number }> => {
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
};
