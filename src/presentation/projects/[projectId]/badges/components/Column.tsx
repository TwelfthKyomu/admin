import type { ProjectBadgeView } from '@/contexts/projectBadge';
import { Badge } from '@/ui/Base';
import { editDeleteColumn } from '@/ui/Base/Table';
import { createColumnHelper } from '@tanstack/react-table';

const { display, accessor } = createColumnHelper<ProjectBadgeView>();

interface ColumnsProps {
    onEdit: (badge: ProjectBadgeView) => void;
    onDelete: (badge: ProjectBadgeView) => void;
    isDeleting: boolean;
}

export const COLUMNS = (props: ColumnsProps) => [
    display({
        id: 'preview',
        header: 'Бейдж',
        cell: ({ row: { original } }) => (
            <Badge style={{ background: original.color, color: '#fff', border: 'none' }}>
                {original.label}
            </Badge>
        ),
    }),
    accessor('code', {
        header: 'Код',
        cell: ({ getValue }) => <code>{getValue()}</code>,
    }),
    accessor('color', {
        header: 'Цвет',
        cell: ({ getValue }) => <code>{getValue()}</code>,
    }),
    accessor('isActive', {
        header: 'Статус',
        cell: ({ getValue }) => (
            <Badge variant={getValue() ? 'default' : 'outline'}>
                {getValue() ? 'Активен' : 'Выключен'}
            </Badge>
        ),
    }),
    editDeleteColumn(props),
];
