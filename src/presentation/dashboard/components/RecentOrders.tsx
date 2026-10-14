import { ColorDot, EmptyState, Widget, WidgetBody, WidgetHeader } from '@/shared/components/common';
import { ROUTES } from '@/shared/constants';
import { fmtDateTime } from '@/shared/format/date';
import { fmtMoney } from '@/shared/format/money';
import { ORDER_STATUS_LABEL, ORDER_STATUS_VARIANT } from '@/shared/labels/order';
import { cn } from '@/shared/lib/utils';
import type { RecentOrderView } from '@/contexts/order';
import type { ProjectView } from '@/contexts/project';
import { ReceiptText } from 'lucide-react';
import Link from 'next/link';

interface RecentOrdersProps {
    orders: RecentOrderView[];
    projects: ProjectView[];
}

export const RecentOrders = ({ orders, projects }: RecentOrdersProps) => {
    const projectById = new Map(projects.map((project) => [project.id, project]));

    return (
        <Widget
            padding="md"
            className="gap-3"
        >
            <WidgetHeader icon={<ReceiptText className="size-4" />}>Последние заказы</WidgetHeader>
            <WidgetBody>
                {orders.length === 0 ? (
                    <EmptyState
                        icon={ReceiptText}
                        title="Заказов ещё нет"
                        description="Новые заказы появятся здесь сразу после создания."
                        className="py-6"
                    />
                ) : (
                    <ul className="flex flex-col divide-y">
                        {orders.map((order) => {
                            const project = projectById.get(order.projectId);

                            return (
                                <li key={order.id}>
                                    <Link
                                        href={ROUTES.project(order.projectId, 'orders', order.id)}
                                        className="-mx-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 rounded-md px-2 py-2 text-sm transition-colors hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                    >
                                        <span className="flex min-w-0 flex-col gap-0.5">
                                            <span className="truncate font-medium">
                                                {order.customerName ?? 'Без имени'}
                                            </span>
                                            <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-muted-foreground">
                                                <ColorDot
                                                    color={project?.color}
                                                    className="size-2"
                                                />
                                                <span className="truncate">
                                                    {project?.name ?? 'Проект'}
                                                </span>
                                                <span aria-hidden>·</span>
                                                <span className="shrink-0">
                                                    {fmtDateTime(order.createdAt)}
                                                </span>
                                            </span>
                                        </span>
                                        <span className="flex flex-col items-end gap-0.5">
                                            <span className="font-medium tabular-nums">
                                                {fmtMoney(order.totalAmount, order.currency)}
                                            </span>
                                            <span
                                                className={cn(
                                                    'text-[11px] text-muted-foreground',
                                                    ORDER_STATUS_VARIANT[order.status] ===
                                                        'destructive' && 'text-destructive',
                                                )}
                                            >
                                                {ORDER_STATUS_LABEL[order.status]}
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </WidgetBody>
        </Widget>
    );
};
