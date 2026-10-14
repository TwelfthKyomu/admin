import { ColorDot } from '@/shared/components/common';
import { ROUTES } from '@/shared/constants';
import { fmtTimeRange } from '@/shared/format/date';
import { deliveryStatusLabel } from '@/shared/labels/delivery';
import { DeliveryKind } from '@/contexts/delivery';
import type { MyDayView } from '@/contexts/order';
import type { ProjectView } from '@/contexts/project';
import Link from 'next/link';

interface DeliveryRowProps {
    delivery: MyDayView['deliveries'][number];
    project?: ProjectView;
}

export const DeliveryRow = ({ delivery, project }: DeliveryRowProps) => (
    <li>
        <Link
            href={ROUTES.project(delivery.projectId, 'orders', delivery.orderId)}
            className="-mx-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
            <span className="flex min-w-0 flex-col gap-0.5">
                <span className="truncate font-medium">
                    {delivery.address ?? 'Адрес не указан'}
                </span>
                <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                    <ColorDot
                        color={project?.color}
                        className="size-2"
                    />
                    <span className="truncate">
                        {delivery.recipientName ?? project?.name ?? 'Проект'}
                    </span>
                </span>
            </span>
            <span className="flex flex-col items-end gap-0.5">
                <span className="font-mono text-xs tabular-nums">
                    {delivery.windowStart && delivery.windowEnd
                        ? fmtTimeRange(delivery.windowStart, delivery.windowEnd)
                        : 'без окна'}
                </span>
                <span className="text-[11px] text-muted-foreground">
                    {deliveryStatusLabel(DeliveryKind.COURIER, delivery.status)}
                </span>
            </span>
        </Link>
    </li>
);
