'use client';

import { useProject, useStaticData } from '@/app/providers';
import type { StatItem } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { modal } from '@/shared/lib/modal';
import { matchesSearch } from '@/shared/lib/search';
import {
    EmployeeKind,
    type ProjectEmployeeView,
    useProjectEmployees,
    useUpdateAssignment,
} from '@/contexts/employeeAssignment';
import { ShiftStatus } from '@/contexts/employeeShift';
import type { ProjectRole } from '@/contexts/project';
import {
    inviteStatusAt,
    ProjectInviteStatus,
    useProjectInvitesList,
} from '@/contexts/projectInvite';
import {
    type ProjectMemberView,
    useChangeProjectMemberRole,
    useDetachProjectMember,
    useEnsureMemberSchedule,
    useProjectMembersList,
} from '@/contexts/projectMember';
import { Permission } from '@/contexts/user';
import dynamic from 'next/dynamic';
import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs';
import { useKindParam } from '../../hooks/useKindParam';

const InviteCreateModal = dynamic(() =>
    import('../modal/InviteCreateModal').then((m) => m.InviteCreateModal),
);

const STATUS_VALUES = ['active', 'ended'] as const;

export type MemberStatusFilterValue = (typeof STATUS_VALUES)[number];

export interface MemberRow extends ProjectMemberView {
    employee?: ProjectEmployeeView;
}

export function useMembersPage() {
    const { projectId, currency, can } = useProject();
    const { user } = useStaticData();
    const [search, setSearch] = useQueryState('q', parseAsString.withDefault(''));

    const [status, setStatus] = useQueryState(
        'status',
        parseAsStringLiteral(STATUS_VALUES).withDefault('active'),
    );

    const { kind, setKind, matches } = useKindParam();

    const membersQuery = useProjectMembersList(projectId);

    const employeesQuery = useProjectEmployees({
        projectId,
        includeEnded: status === 'ended',
    });

    const invitesQuery = useProjectInvitesList(projectId);

    const ensureSchedule = useEnsureMemberSchedule();
    const detach = useDetachProjectMember();
    const changeRole = useChangeProjectMemberRole();
    const updateAssignment = useUpdateAssignment(projectId);

    const employees = employeesQuery.data ?? [];
    const activeEmployees = employees.filter((employee) => !employee.endedAt);
    const employeeByUser = new Map(activeEmployees.map((employee) => [employee.userId, employee]));

    const kindOf = (employee?: ProjectEmployeeView): EmployeeKind =>
        employee?.kind ?? EmployeeKind.SPECIALIST;

    const members: MemberRow[] = (membersQuery.data ?? [])
        .map((member) => ({
            ...member,
            employee: employeeByUser.get(member.userId),
        }))
        .filter((row) => matches(kindOf(row.employee)))
        .filter((row) =>
            matchesSearch(search, row.userName, row.userEmail, row.employee?.position),
        );

    const ended = employees
        .filter((employee) => !!employee.endedAt)
        .filter((employee) => matches(employee.kind))
        .filter((employee) =>
            matchesSearch(search, employee.name, employee.email, employee.position),
        );

    const couriers = activeEmployees.filter(
        (employee) => employee.kind === EmployeeKind.COURIER,
    ).length;

    const onShift = activeEmployees.filter(
        (employee) => employee.today?.status === ShiftStatus.IN_PROGRESS,
    );

    const onShiftCouriers = onShift.filter(
        (employee) => employee.kind === EmployeeKind.COURIER,
    ).length;

    const pendingInvites = (invitesQuery.data ?? []).filter(
        (invite) => inviteStatusAt(invite) === ProjectInviteStatus.PENDING,
    );

    const stats: StatItem[] = [
        {
            label: 'В проекте',
            value: membersQuery.data?.length ?? 0,
            hint: `${activeEmployees.length - couriers} мастеров · ${couriers} курьеров`,
        },
        {
            label: 'На смене сейчас',
            value: onShift.length,
            hint: onShiftCouriers > 0 ? `из них курьеров: ${onShiftCouriers}` : undefined,
        },
        {
            label: 'Ищут замену',
            value: activeEmployees.filter((employee) => employee.seekingShifts > 0).length,
            hint: 'ближайшие смены',
        },
        { label: 'Приглашения', value: pendingInvites.length, hint: 'ждут принятия' },
    ];

    const onInvite = () => modal.open(<InviteCreateModal projectId={projectId} />);

    const onChangeRole = async (memberId: string, role: ProjectRole) => {
        await runAction(changeRole.mutateAsync({ projectId, memberId, role }), {
            success: 'Роль изменена',
        });
    };

    const onAddToSchedule = async (userId: string) => {
        await runAction(ensureSchedule.mutateAsync({ projectId, userId }), {
            success: 'Сотрудник добавлен в расписание',
        });
    };

    const onDetach = async (memberId: string) => {
        await runAction(detach.mutateAsync({ projectId, memberId }), {
            success: 'Участник отвязан от проекта',
        });
    };

    const onToggleBookable = async (assignmentId: string, isBookable: boolean) => {
        await runAction(
            updateAssignment.mutateAsync({
                projectId,
                id: assignmentId,
                isBookable,
            }),
        );
    };

    return {
        membersQuery,
        employeesQuery,
        members,
        ended,
        stats,
        search,
        setSearch: (value: string) => void setSearch(value || null),
        status,
        setStatus: (value: MemberStatusFilterValue) =>
            void setStatus(value === 'active' ? null : value),
        kind,
        setKind,
        currentUserId: user.id,
        currency,
        canManageRoles: can(Permission.MANAGE_ROLES),
        canManageStaff: can(Permission.MANAGE_BOOKINGS),
        onInvite,
        onChangeRole,
        onToggleBookable,
        onAddToSchedule,
        onDetach,
    };
}
