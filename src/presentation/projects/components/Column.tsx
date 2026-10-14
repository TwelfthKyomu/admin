import type { ProjectView } from '@/contexts/project';
import { editDeleteColumn } from '@/ui/Base/Table';
import { createColumnHelper } from '@tanstack/react-table';

const { accessor } = createColumnHelper<ProjectView>();

interface ColumnsProps {
    onEdit: (project: ProjectView) => void;
    onDelete: (project: ProjectView) => void;
    isDeleting: boolean;
}

export const COLUMNS = (props: ColumnsProps) => [
    accessor('name', {
        header: 'Название',
    }),
    editDeleteColumn(props),
];
