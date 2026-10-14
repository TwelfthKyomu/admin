import { fmtMoney } from '@/shared/format/money';
import { PRODUCT_STATUS_LABEL, PRODUCT_TYPE_LABEL } from '@/shared/labels/catalog';
import type { ProductView } from '@/contexts/product';
import { Avatar, AvatarFallback, AvatarImage, Badge } from '@/ui/Base';
import { editDeleteColumn } from '@/ui/Base/Table';
import { createColumnHelper } from '@tanstack/react-table';
import { Package } from 'lucide-react';
import { editionLabel } from '../lib/edition';

const { accessor } = createColumnHelper<ProductView>();

interface ColumnsProps {
    onEdit: (product: ProductView) => void;
    onDelete: (product: ProductView) => void;
    isDeleting: boolean;
}

export const COLUMNS = (props: ColumnsProps) => [
    accessor('name', {
        header: 'Название',
        cell: ({ row: { original } }) => (
            <div className="flex items-center gap-3">
                <Avatar className="size-10 rounded-md">
                    <AvatarImage
                        src={original.images[0]}
                        alt={original.name}
                        className="object-cover"
                    />
                    <AvatarFallback className="rounded-md">
                        <Package className="size-4 text-muted-foreground" />
                    </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                    <div className="truncate">{original.name}</div>
                    <div className="truncate text-muted-foreground text-xs">/{original.slug}</div>
                </div>
            </div>
        ),
    }),
    accessor('sku', {
        header: 'SKU',
        cell: ({ getValue }) => <code>{getValue()}</code>,
    }),
    accessor('price', {
        header: 'Цена',
        cell: ({ row: { original } }) => fmtMoney(original.price, original.currency),
    }),
    accessor('type', {
        header: 'Тип',
        cell: ({ getValue }) => PRODUCT_TYPE_LABEL[getValue()],
    }),
    accessor('status', {
        header: 'Статус',
        cell: ({ getValue }) => <Badge>{PRODUCT_STATUS_LABEL[getValue()]}</Badge>,
    }),
    accessor('stock', {
        header: 'Остаток',
        cell: ({ row: { original } }) => {
            const edition = editionLabel(original);

            return (
                <div>
                    <div>{original.stock ?? '—'}</div>
                    {edition && <div className="text-muted-foreground text-xs">{edition}</div>}
                </div>
            );
        },
    }),
    editDeleteColumn(props),
];
