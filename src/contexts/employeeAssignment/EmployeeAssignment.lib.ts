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
import { OPEN_SHIFT_STATUSES } from '@/contexts/employeeShift/EmployeeShift.types';
import { employeeShifts } from '@/contexts/employeeShift/EmployeeShifts.table';
import { findMemberIdByUserId } from '@/contexts/organizationMember/OrganizationMember.lib';
import { OrganizationRole } from '@/contexts/organizationMember/OrganizationMember.types';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { ProjectRole } from '@/contexts/project/Project.types';
import { findActiveProjectMember } from '@/contexts/projectMember/ProjectMember.lib';
import { and, count, eq, gt, inArray, isNull } from 'drizzle-orm';
import { EmployeeKind } from './EmployeeAssignment.types';
import {
    type EmployeeAssignmentRecord,
    employeeAssignments,
} from './EmployeeAssignments.table';

const kindForRole = (role: ProjectRole | null): EmployeeKind => {
    return role === ProjectRole.COURIER
        ? EmployeeKind.COURIER
        : EmployeeKind.SPECIALIST;
};

const resolvePosition = async (input: {
    organizationId: string;
    projectId: string;
    userId: string;
}): Promise<{ position: string; kind: EmployeeKind }> => {
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
};

export const findActiveAssignment = async (
    employeeId: string,
    projectId: string,
    executor: Reader = db,
): Promise<Pick<EmployeeAssignmentRecord, 'id' | 'kind'> | null> => {
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
};

export const findActiveAssignmentsOfEmployee = (
    employeeId: string,
): Promise<EmployeeAssignmentRecord[]> => {
    return db
        .select()
        .from(employeeAssignments)
        .where(
            and(
                eq(employeeAssignments.employeeId, employeeId),
                isNull(employeeAssignments.endedAt),
            ),
        );
};

export const assertActiveAssignments = async (
    projectId: string,
    employeeIds: (string | null | undefined)[],
): Promise<void> => {
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
};

export const ensureEmployeeAssigned = async (input: {
    organizationId: string;
    projectId: string;
    userId: string;
}): Promise<void> => {
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
};

export const syncAssignmentKindWithRole = async (
    input: {
        organizationId: string;
        projectId: string;
        userId: string;
        from: ProjectRole;
        to: ProjectRole;
    },
    executor: Pick<Tx, 'update'> = db,
): Promise<void> => {
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
};

export const assertNoOpenWork = async (
    executor: Reader,
    input: { employeeId: string; projectId?: string },
): Promise<void> => {
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
};

export const endEmployeeAssignment = async (
    input: {
        organizationId: string;
        projectId?: string;
        userId: string;
    },
    executor: Pick<Tx, 'select' | 'update' | 'delete'> = db,
): Promise<void> => {
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
};
