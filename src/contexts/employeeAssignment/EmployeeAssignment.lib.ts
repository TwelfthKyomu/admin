import 'server-only';

import { db, type Reader, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { pluralRu } from '@/shared/format/plural';
import {
    ORGANIZATION_ROLE_LABEL,
    PROJECT_ROLE_LABEL,
} from '@/shared/labels/team';
import { deliveries } from '@/contexts/delivery/Deliveries.table';
import { ACTIVE_DELIVERY_STATUSES } from '@/contexts/delivery/Delivery.types';
import {
    OPEN_SHIFT_STATUSES,
    ShiftStatus,
    WORKING_SHIFT_STATUSES,
} from '@/contexts/employeeShift/EmployeeShift.types';
import { employeeShifts } from '@/contexts/employeeShift/EmployeeShifts.table';
import { findMemberIdByUserId } from '@/contexts/organizationMember/OrganizationMember.lib';
import { OrganizationRole } from '@/contexts/organizationMember/OrganizationMember.types';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { ProjectRole } from '@/contexts/project/Project.types';
import { findActiveProjectMember } from '@/contexts/projectMember/ProjectMember.lib';
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
import {
    EmployeeKind,
    type ProjectEmployeeTodayView,
    type ProjectEmployeeView,
} from './EmployeeAssignment.types';
import {
    type EmployeeAssignmentRecord,
    employeeAssignments,
} from './EmployeeAssignments.table';

function kindForRole(role: ProjectRole | null): EmployeeKind {
    return role === ProjectRole.COURIER
        ? EmployeeKind.COURIER
        : EmployeeKind.SPECIALIST;
}

async function resolvePosition(input: {
    organizationId: string;
    projectId: string;
    userId: string;
}): Promise<{ position: string; kind: EmployeeKind }> {
    const projectMember = await findActiveProjectMember(
        input.projectId,
        input.userId,
    );

    if (projectMember) {
        return {
            position: PROJECT_ROLE_LABEL[projectMember.role],
            kind: kindForRole(projectMember.role),
        };
    }

    const [member] = await db
        .select({ role: organizationMembers.role })
        .from(organizationMembers)
        .where(
            and(
                eq(organizationMembers.organizationId, input.organizationId),
                eq(organizationMembers.userId, input.userId),
                isNull(organizationMembers.leftAt),
            ),
        )
        .limit(1);

    return {
        position:
            ORGANIZATION_ROLE_LABEL[member?.role ?? OrganizationRole.MEMBER],
        kind: EmployeeKind.SPECIALIST,
    };
}

export async function findActiveAssignment(
    employeeId: string,
    projectId: string,
    executor: Reader = db,
): Promise<Pick<EmployeeAssignmentRecord, 'id' | 'kind'> | null> {
    const [assignment] = await executor
        .select({
            id: employeeAssignments.id,
            kind: employeeAssignments.kind,
        })
        .from(employeeAssignments)
        .where(
            and(
                eq(employeeAssignments.employeeId, employeeId),
                eq(employeeAssignments.projectId, projectId),
                isNull(employeeAssignments.endedAt),
            ),
        )
        .limit(1);

    return assignment ?? null;
}

export function findActiveAssignmentsOfEmployee(
    employeeId: string,
): Promise<EmployeeAssignmentRecord[]> {
    return db
        .select()
        .from(employeeAssignments)
        .where(
            and(
                eq(employeeAssignments.employeeId, employeeId),
                isNull(employeeAssignments.endedAt),
            ),
        );
}

export async function assertActiveAssignments(
    projectId: string,
    employeeIds: (string | null | undefined)[],
): Promise<void> {
    const ids = [
        ...new Set(employeeIds.filter((id): id is string => Boolean(id))),
    ];

    if (ids.length === 0) return;

    const rows = await db
        .select({ employeeId: employeeAssignments.employeeId })
        .from(employeeAssignments)
        .where(
            and(
                eq(employeeAssignments.projectId, projectId),
                inArray(employeeAssignments.employeeId, ids),
                isNull(employeeAssignments.endedAt),
            ),
        );

    if (rows.length < ids.length) {
        throw new ApplicationError(
            'Сотрудник не работает в этом проекте — добавьте его в расписание',
        );
    }
}

export async function ensureEmployeeAssigned(input: {
    organizationId: string;
    projectId: string;
    userId: string;
}): Promise<void> {
    const employeeId = await findMemberIdByUserId(
        input.organizationId,
        input.userId,
    );

    if (!employeeId) return;
    if (await findActiveAssignment(employeeId, input.projectId)) return;

    const { position, kind } = await resolvePosition(input);

    await db.insert(employeeAssignments).values({
        employeeId,
        projectId: input.projectId,
        organizationId: input.organizationId,
        position,
        kind,
    });
}

export async function syncAssignmentKindWithRole(
    input: {
        organizationId: string;
        projectId: string;
        userId: string;
        from: ProjectRole;
        to: ProjectRole;
    },
    executor: Pick<Tx, 'update'> = db,
): Promise<void> {
    const after = kindForRole(input.to);

    if (kindForRole(input.from) === after) return;

    const employeeId = await findMemberIdByUserId(
        input.organizationId,
        input.userId,
    );

    if (!employeeId) return;

    await executor
        .update(employeeAssignments)
        .set({
            kind: after,
            position: PROJECT_ROLE_LABEL[input.to],
        })
        .where(
            and(
                eq(employeeAssignments.employeeId, employeeId),
                eq(employeeAssignments.projectId, input.projectId),
                isNull(employeeAssignments.endedAt),
            ),
        );
}

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

export async function assertNoOpenWork(
    executor: Reader,
    input: { employeeId: string; projectId?: string },
): Promise<void> {
    const { employeeId, projectId } = input;

    const [[shifts], [deliveryRows]] = await Promise.all([
        executor
            .select({ value: count() })
            .from(employeeShifts)
            .where(
                and(
                    eq(employeeShifts.employeeId, employeeId),
                    projectId
                        ? eq(employeeShifts.projectId, projectId)
                        : undefined,
                    inArray(employeeShifts.status, OPEN_SHIFT_STATUSES),
                    gt(employeeShifts.endsAt, new Date()),
                ),
            ),
        executor
            .select({ value: count() })
            .from(deliveries)
            .where(
                and(
                    eq(deliveries.courierId, employeeId),
                    projectId ? eq(deliveries.projectId, projectId) : undefined,
                    inArray(deliveries.status, ACTIVE_DELIVERY_STATUSES),
                ),
            ),
    ]);

    const counted = (amount: number, forms: [string, string, string]) =>
        amount > 0 ? `${amount} ${pluralRu(amount, forms)}` : null;

    const parts = [
        counted(shifts?.value ?? 0, ['смену', 'смены', 'смен']),
        counted(deliveryRows?.value ?? 0, ['доставку', 'доставки', 'доставок']),
    ].filter((part) => part !== null);

    if (parts.length === 0) return;

    throw new ApplicationError(
        `За сотрудником ещё ${parts.join(', ')}. Передайте их другому сотруднику или отмените, затем повторите.`,
    );
}

export async function endEmployeeAssignment(
    input: {
        organizationId: string;
        projectId?: string;
        userId: string;
    },
    executor: Pick<Tx, 'select' | 'update' | 'delete'> = db,
): Promise<void> {
    const [member] = await executor
        .select({ id: organizationMembers.id })
        .from(organizationMembers)
        .where(
            and(
                eq(organizationMembers.organizationId, input.organizationId),
                eq(organizationMembers.userId, input.userId),
            ),
        )
        .limit(1);

    if (!member) return;

    const employeeId = member.id;

    await executor
        .update(employeeAssignments)
        .set({
            endedAt: new Date(),
        })
        .where(
            and(
                eq(employeeAssignments.employeeId, employeeId),
                input.projectId
                    ? eq(employeeAssignments.projectId, input.projectId)
                    : undefined,
                isNull(employeeAssignments.endedAt),
            ),
        );
}
