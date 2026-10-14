import { PROJECT_CATEGORY_TYPE_LABEL } from '@/shared/labels/catalog';
import type { ProjectCategoryView } from '@/contexts/projectCategory';
import { Badge } from '@/ui/Base';
import { editDeleteColumn } from '@/ui/Base/Table';
import { createColumnHelper } from '@tanstack/react-table';

const { accessor } = createColumnHelper<ProjectCategoryView>();

interface ColumnsProps {
    onEdit: (category: ProjectCategoryView) => void;
    onDelete: (category: ProjectCategoryView) => void;
    isDeleting: boolean;
}

export const COLUMNS = (props: ColumnsProps) => [
    accessor('name', {
        header: 'Название',
        cell: ({ row: { original } }) => (
            <div>
                <div>{original.name}</div>
                <div>/{original.slug}</div>
            </div>
        ),
    }),
    accessor('type', {
        header: 'Тип',
        cell: ({ getValue }) => PROJECT_CATEGORY_TYPE_LABEL[getValue()],
    }),
    accessor('isActive', {
        header: 'Статус',
        cell: ({ getValue }) => (
            <Badge variant={getValue() ? 'default' : 'outline'}>
                {getValue() ? 'Активна' : 'Выключена'}
            </Badge>
        ),
    }),
    editDeleteColumn(props),
];
