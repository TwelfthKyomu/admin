import 'server-only';

import { db } from '@/infrastructure/database/client';
import {
    ShiftStatus,
    WORKING_SHIFT_STATUSES,
} from '@/contexts/employeeShift/EmployeeShift.types';
import { employeeShifts } from '@/contexts/employeeShift/EmployeeShifts.table';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { projectMembers } from '@/contexts/projectMember/ProjectMembers.table';
import { users } from '@/contexts/user/Users.table';
import { addDays, startOfDay } from 'date-fns';
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
    ne,
} from 'drizzle-orm';
import type {
    ProjectEmployeeTodayView,
    ProjectEmployeeView,
} from './EmployeeAssignment.types';
import { employeeAssignments } from './EmployeeAssignments.table';

export async function listProjectEmployees(
    projectId: string,
    options: { includeEnded: boolean; withRates: boolean; now?: Date },
): Promise<ProjectEmployeeView[]> {
    const now = options.now ?? new Date();
    const dayStart = startOfDay(now);
    const dayEnd = addDays(dayStart, 1);

    const rows = await db
        .select({
            assignment: employeeAssignments,
            userId: users.id,
            name: users.name,
            email: users.email,
            image: users.image,
            projectRole: projectMembers.role,
        })
        .from(employeeAssignments)
        .innerJoin(
            organizationMembers,
            eq(organizationMembers.id, employeeAssignments.employeeId),
        )
        .innerJoin(users, eq(users.id, organizationMembers.userId))
        .leftJoin(
            projectMembers,
            and(
                eq(projectMembers.userId, users.id),
                eq(projectMembers.projectId, employeeAssignments.projectId),
                isNull(projectMembers.leftAt),
            ),
        )
        .where(
            and(
                eq(employeeAssignments.projectId, projectId),
                options.includeEnded
                    ? undefined
                    : isNull(employeeAssignments.endedAt),
            ),
        )
        .orderBy(asc(employeeAssignments.kind), asc(users.name));

    const employeeIds = rows.map((row) => row.assignment.employeeId);

    if (employeeIds.length === 0) return [];

    const [todayShifts, seeking] = await Promise.all([
        db
            .select({
                id: employeeShifts.id,
                employeeId: employeeShifts.employeeId,
                status: employeeShifts.status,
                startsAt: employeeShifts.startsAt,
                endsAt: employeeShifts.endsAt,
            })
            .from(employeeShifts)
            .where(
                and(
                    eq(employeeShifts.projectId, projectId),
                    inArray(employeeShifts.employeeId, employeeIds),
                    inArray(employeeShifts.status, WORKING_SHIFT_STATUSES),
                    lt(employeeShifts.startsAt, dayEnd),
                    gt(employeeShifts.endsAt, dayStart),
                ),
            )
            .orderBy(desc(employeeShifts.startsAt)),
        db
            .select({ employeeId: employeeShifts.employeeId, total: count() })
            .from(employeeShifts)
            .where(
                and(
                    eq(employeeShifts.projectId, projectId),
                    inArray(employeeShifts.employeeId, employeeIds),
                    eq(employeeShifts.seekingReplacement, true),
                    ne(employeeShifts.status, ShiftStatus.CANCELLED),
                    gte(employeeShifts.startsAt, now),
                ),
            )
            .groupBy(employeeShifts.employeeId),
    ]);

    const todayByEmployee = new Map<string, ProjectEmployeeTodayView>();

    for (const shift of todayShifts) {
        const current = todayByEmployee.get(shift.employeeId);

        const keepCurrent =
            current?.status === ShiftStatus.IN_PROGRESS &&
            shift.status !== ShiftStatus.IN_PROGRESS;

        if (keepCurrent) continue;

        todayByEmployee.set(shift.employeeId, {
            shiftId: shift.id,
            status: shift.status,
            startsAt: shift.startsAt,
            endsAt: shift.endsAt,
        });
    }

    const seekingByEmployee = new Map(
        seeking.map((row) => [row.employeeId, row.total]),
    );

    return rows.map(({ assignment, ...row }) => ({
        assignmentId: assignment.id,
        employeeId: assignment.employeeId,
        userId: row.userId,
        name: row.name,
        email: row.email,
        image: row.image,
        position: assignment.position,
        kind: assignment.kind,
        endedAt: assignment.endedAt,
        metadata: assignment.metadata,
        projectRole: row.projectRole,
        rates: options.withRates
            ? {
                  shiftRateAmount: assignment.shiftRateAmount,
                  commissionRate: assignment.commissionRate,
                  siteCommissionRate: assignment.siteCommissionRate,
                  deliveryRateAmount: assignment.deliveryRateAmount,
              }
            : null,
        today: todayByEmployee.get(assignment.employeeId) ?? null,
        seekingShifts: seekingByEmployee.get(assignment.employeeId) ?? 0,
    }));
}
