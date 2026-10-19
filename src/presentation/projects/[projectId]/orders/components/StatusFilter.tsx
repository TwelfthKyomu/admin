'use client';

import { ORDER_STATUS_LABEL_SHORT } from '@/shared/labels/order';
import { OrderStatus } from '@/contexts/order';
import { type TabItem, Tabs } from '@/ui/Base';

export type StatusFilterValue = OrderStatus | 'all';

const VISIBLE_STATUSES: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.IN_PROGRESS,
    OrderStatus.READY,
    OrderStatus.COMPLETED,
    OrderStatus.CANCELLED,
];

const STATUS_TABS: TabItem<StatusFilterValue>[] = [
    { value: 'all', label: 'Все' },
    ...VISIBLE_STATUSES.map((status) => ({
        value: status,
        label: ORDER_STATUS_LABEL_SHORT[status],
    })),
];

interface StatusFilterProps {
    value: StatusFilterValue;
    onChange: (next: StatusFilterValue) => void;
}

export const StatusFilter = ({ value, onChange }: StatusFilterProps) => (
    <Tabs<StatusFilterValue>
        items={STATUS_TABS}
        value={value}
        onValueChange={onChange}
    />
);
