import { ROUTES } from '@/shared/constants';
import { fmtDateTime } from '@/shared/format/date';
import {
    DELIVERY_CARRIER_LABEL,
    DELIVERY_STATUS_VARIANT,
    deliveryStatusLabel,
} from '@/shared/labels/delivery';
import { type DeliveryView, deliveryTrackUrl } from '@/contexts/delivery';
import { Badge } from '@/ui/Base';
import { createColumnHelper } from '@tanstack/react-table';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';

const { display } = createColumnHelper<DeliveryView>();

export const CARRIER_COLUMNS = (projectId: string) => [
    display({
        id: 'order',
        header: 'Заказ',
        cell: ({ row: { original } }) => (
            <Link
                href={ROUTES.project(projectId, 'orders', original.orderId)}
                className="font-medium hover:underline"
            >
                {original.customerName ?? 'Заказ'}
            </Link>
        ),
    }),
    display({
        id: 'carrier',
        header: 'Служба',
        cell: ({ row: { original } }) =>
            original.carrier ? DELIVERY_CARRIER_LABEL[original.carrier] : '—',
    }),
    display({
        id: 'tracking',
        header: 'Трек',
        cell: ({ row: { original } }) => {
            if (!original.trackingNumber) return '—';

            const url = deliveryTrackUrl(original);

            if (!url) return <code>{original.trackingNumber}</code>;

            return (
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 hover:underline"
                >
                    <code>{original.trackingNumber}</code>
                    <ExternalLink className="size-3.5" />
                </a>
            );
        },
    }),
    display({
        id: 'status',
        header: 'Статус',
        cell: ({ row: { original } }) => (
            <Badge variant={DELIVERY_STATUS_VARIANT[original.status]}>
                {deliveryStatusLabel(original.kind, original.status)}
            </Badge>
        ),
    }),
    display({
        id: 'address',
        header: 'Адрес',
        cell: ({ row: { original } }) => original.address ?? '—',
    }),
    display({
        id: 'created',
        header: 'Создана',
        cell: ({ row: { original } }) => fmtDateTime(original.createdAt),
    }),
];
