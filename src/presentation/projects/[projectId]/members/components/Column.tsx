import { PersonCell } from '@/shared/components/common';
import type { Currency } from '@/shared/constants/currency';
import { fmtDate } from '@/shared/format/date';
import {
    ORGANIZATION_ROLE_LABEL,
    ORGANIZATION_ROLE_VARIANT,
    PROJECT_ROLE_LABEL,
    PROJECT_ROLE_OPTIONS,
} from '@/shared/labels/team';
import type { ProjectEmployeeView } from '@/contexts/employeeAssignment';
import { isOrganizationManager } from '@/contexts/organizationMember';
import type { ProjectRole } from '@/contexts/project';
import { Badge, Select } from '@/ui/Base';
import type { TableActionItem } from '@/ui/Base/Table';
import { ActionTableButton } from '@/ui/Base/Table/components/ActionTableButton';
import { createColumnHelper } from '@tanstack/react-table';
import { EmployeeToday } from '../../components/EmployeeToday';
import { KindBadge } from '../../components/KindBadge';
import { RatesCell } from '../../components/RatesCell';
import type { MemberRow } from '../hooks/useMembersPage';

const { display } = createColumnHelper<MemberRow>();

interface ColumnsProps {
    currentUserId: string;
    currency: Currency;
    canManageRoles: boolean;
    onChangeRole: (memberId: string, role: ProjectRole) => void;
    onAddToSchedule: (userId: string) => void;
    onDetach: (memberId: string) => void;
}

export const COLUMNS = ({
    currentUserId,
    currency,
    canManageRoles,
    onChangeRole,
    onAddToSchedule,
    onDetach,
}: ColumnsProps) => [
    display({
        id: 'user',
        header: 'Сотрудник',
        cell: ({ row: { original } }) => (
            <PersonCell
                name={
                    original.userId === currentUserId
                        ? `${original.userName} (вы)`
                        : original.userName
                }
                image={original.employee?.image}
                caption={original.employee?.position ?? original.userEmail}
            />
        ),
    }),
    display({
        id: 'kind',
        header: 'Вид работы',
        cell: ({ row: { original } }) =>
            original.employee ? <KindBadge kind={original.employee.kind} /> : 'не в расписании',
    }),
    display({
        id: 'role',
        header: 'Роль в проекте',
        cell: ({ row: { original } }) => {
            const { id, userId, projectRole, organizationRole } = original;

            if (organizationRole && isOrganizationManager(organizationRole)) {
                return (
                    <Badge variant={ORGANIZATION_ROLE_VARIANT[organizationRole]}>
                        {ORGANIZATION_ROLE_LABEL[organizationRole]}
                    </Badge>
                );
            }

            if (!canManageRoles || userId === currentUserId) {
                return <Badge variant="outline">{PROJECT_ROLE_LABEL[projectRole]}</Badge>;
            }

            return (
                <Select<ProjectRole>
                    size="sm"
                    options={PROJECT_ROLE_OPTIONS}
                    value={projectRole}
                    onValueChange={(role) => onChangeRole(id, role)}
                />
            );
        },
    }),
    display({
        id: 'rates',
        header: 'Ставки',
        cell: ({ row: { original } }) =>
            original.employee ? (
                <RatesCell
                    kind={original.employee.kind}
                    rates={original.employee.rates}
                    currency={currency}
                />
            ) : null,
    }),
    display({
        id: 'today',
        header: 'Сегодня',
        cell: ({ row: { original } }) =>
            original.employee ? <EmployeeToday employee={original.employee} /> : null,
    }),
    display({
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row: { original } }) => {
            const { id, userId, inSchedule } = original;
            const items: TableActionItem[] = [];

            if (!inSchedule) {
                items.push({
                    key: 'schedule',
                    label: 'Добавить в расписание',
                    onSelect: () => onAddToSchedule(userId),
                });
            }

            if (userId !== currentUserId) {
                items.push({
                    key: 'detach',
                    label: 'Убрать из проекта',
                    variant: 'destructive',
                    onSelect: () => onDetach(id),
                });
            }

            if (items.length === 0) return null;

            return (
                <ActionTableButton
                    items={items}
                    label="Действия"
                />
            );
        },
    }),
];

const { display: endedDisplay } = createColumnHelper<ProjectEmployeeView>();

export const ENDED_COLUMNS = [
    endedDisplay({
        id: 'user',
        header: 'Сотрудник',
        cell: ({ row: { original } }) => (
            <PersonCell
                name={original.name}
                image={original.image}
                caption={original.position}
            />
        ),
    }),
    endedDisplay({
        id: 'kind',
        header: 'Вид работы',
        cell: ({ row: { original } }) => <KindBadge kind={original.kind} />,
    }),
    endedDisplay({
        id: 'ended',
        header: 'Ушёл',
        cell: ({ row: { original } }) => fmtDate(original.endedAt),
    }),
];
