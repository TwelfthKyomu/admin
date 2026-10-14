import { ColorDot, PersonCell } from '@/shared/components/common';
import { fmtDate } from '@/shared/format/date';
import {
    ASSIGNABLE_ORGANIZATION_ROLE_OPTIONS,
    ORGANIZATION_ROLE_LABEL,
    ORGANIZATION_ROLE_VARIANT,
} from '@/shared/labels/team';
import type { OrganizationMemberView, OrganizationRole } from '@/contexts/organizationMember';
import { Badge, Button, Select } from '@/ui/Base';
import { createColumnHelper } from '@tanstack/react-table';

const { accessor, display } = createColumnHelper<OrganizationMemberView>();

interface ColumnsProps {
    currentUserId: string;
    isMutating?: boolean;
    canChangeRole: (member: OrganizationMemberView) => boolean;
    onChangeRole: (memberId: string, role: OrganizationRole) => void;
    canOffboard: (member: OrganizationMemberView) => boolean;
    onOffboard: (member: OrganizationMemberView) => void;
}

export const getColumns = ({
    currentUserId,
    canChangeRole,
    onChangeRole,
    canOffboard,
    onOffboard,
}: ColumnsProps) => [
    accessor('user', {
        header: 'Участник',
        cell: ({ getValue }) => {
            const user = getValue();

            return (
                <PersonCell
                    name={user.name}
                    image={user.image}
                    caption={user.id === currentUserId ? `${user.email} · вы` : user.email}
                />
            );
        },
    }),
    accessor('role', {
        header: 'Роль',
        cell: ({ row: { original: member } }) =>
            canChangeRole(member) ? (
                <Select<OrganizationRole>
                    size="sm"
                    options={ASSIGNABLE_ORGANIZATION_ROLE_OPTIONS}
                    value={member.role}
                    onValueChange={(role) => onChangeRole(member.id, role)}
                />
            ) : (
                <Badge variant={ORGANIZATION_ROLE_VARIANT[member.role]}>
                    {ORGANIZATION_ROLE_LABEL[member.role]}
                </Badge>
            ),
    }),
    display({
        id: 'projects',
        header: 'Проекты',
        cell: ({
            row: {
                original: { projects },
            },
        }) => {
            if (projects.length === 0) {
                return '—';
            }

            return (
                <div className="flex flex-wrap gap-1">
                    {projects.map(({ id, name, color }) => (
                        <Badge
                            key={id}
                            variant="outline"
                            className="gap-1.5"
                        >
                            <ColorDot
                                color={color}
                                className="size-2"
                            />
                            {name}
                        </Badge>
                    ))}
                </div>
            );
        },
    }),
    accessor('joinedAt', {
        header: 'Дата вступления',
        cell: ({
            row: {
                original: { joinedAt },
            },
        }) => <span>{fmtDate(joinedAt)}</span>,
    }),
    display({
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row: { original: member } }) =>
            canOffboard(member) ? (
                <div className="flex justify-end">
                    <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onOffboard(member)}
                    >
                        Уволить
                    </Button>
                </div>
            ) : null,
    }),
];
