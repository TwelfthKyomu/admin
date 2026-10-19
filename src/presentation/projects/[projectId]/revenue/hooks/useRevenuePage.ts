'use client';

import { useProject } from '@/app/providers';
import { type StatItem, usePeriodParam } from '@/shared/components/common';
import { fmtMoney } from '@/shared/format/money';
import { useCourierStats } from '@/contexts/delivery';
import { useEmployeeRevenue } from '@/contexts/order';

export function useRevenuePage() {
    const { projectId, currency } = useProject();
    const period = usePeriodParam();
    const { from, to } = period.range;
    const sellersQuery = useEmployeeRevenue({ projectId, from, to });
    const couriersQuery = useCourierStats({ projectId, from, to });

    const sellers = sellersQuery.data ?? [];
    const couriers = couriersQuery.data ?? [];

    const sellersTotal = sellers.reduce(
        (sum, row) => sum + row.revenueAmount,
        0,
    );

    const delivered = couriers.reduce((sum, row) => sum + row.delivered, 0);
    const failed = couriers.reduce((sum, row) => sum + row.failed, 0);
    const collected = couriers.reduce((sum, row) => sum + row.collected, 0);
    const onHand = couriers.reduce((sum, row) => sum + row.onHand, 0);

    const stats: StatItem[] = [
        {
            label: 'Выручка продавцов',
            value: fmtMoney(sellersTotal, currency),
            hint: `${sellers.length} в списке`,
        },
        {
            label: 'Доставлено',
            value: delivered,
            hint: `${failed} не доставлено`,
        },
        { label: 'Принято у двери', value: fmtMoney(collected, currency) },
        {
            label: 'На руках у курьеров',
            value: fmtMoney(onHand, currency),
            hint: 'ждут сдачи в кассу',
        },
    ];

    return {
        period,
        currency,
        sellersQuery,
        couriersQuery,
        sellersTotal,
        delivered,
        stats,
    };
}
