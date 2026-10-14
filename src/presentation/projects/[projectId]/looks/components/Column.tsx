import type { LookView } from '@/contexts/look';
import { Badge } from '@/ui/Base';
import { editDeleteColumn } from '@/ui/Base/Table';
import { createColumnHelper } from '@tanstack/react-table';

const { display, accessor } = createColumnHelper<LookView>();

interface ColumnsProps {
    onEdit: (look: LookView) => void;
    onDelete: (look: LookView) => void;
    isDeleting: boolean;
}

export const COLUMNS = (props: ColumnsProps) => [
    display({
        id: 'preview',
        header: 'Фото',
        cell: ({ row: { original } }) => (
            // biome-ignore lint/performance/noImgElement: фото образа отдаёт /files или внешняя ссылка
            <img
                src={original.image}
                alt=""
                className="h-14 w-11 rounded-sm object-cover"
            />
        ),
    }),
    accessor('title', {
        header: 'Название',
    }),
    accessor('items', {
        header: 'Товаров',
        cell: ({ getValue }) => getValue().length,
    }),
    accessor('isActive', {
        header: 'Статус',
        cell: ({ getValue }) => (
            <Badge variant={getValue() ? 'default' : 'outline'}>
                {getValue() ? 'На сайте' : 'Скрыт'}
            </Badge>
        ),
    }),
    editDeleteColumn(props),
];
