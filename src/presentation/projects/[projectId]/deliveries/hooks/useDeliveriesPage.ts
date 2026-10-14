'use client';

import { useState } from 'react';
import { useProject } from '@/app/providers';
import type { StatItem } from '@/shared/components/common';
import { fmtTimeRange } from '@/shared/format/date';
import { fmtMoney } from '@/shared/format/money';
import { runAction } from '@/shared/lib/action-result';
import { useCashSummary } from '@/contexts/cashShift';
import {
    DeliveryKind,
    DeliveryStatus,
    type DeliveryView,
    IN_WORK_DELIVERY_STATUSES,
    useAssignDelivery,
    useCancelDelivery,
    useDeliveries,
    useRequeueDelivery,
} from '@/contexts/delivery';
import {
    EmployeeKind,
    useProjectEmployees,
} from '@/contexts/employeeAssignment';
import { Permission } from '@/contexts/user';
import { employeeOptions } from '@/presentation/projects/[projectId]/schedule/lib/employees';
import { addDays, startOfDay } from 'date-fns';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { byDeliveryStatus } from '../lib/deliveries';

const MODE_VALUES = ['couriers', 'carriers'] as const;

export type DeliveriesMode = (typeof MODE_VALUES)[number];

export interface CourierRow {
    employeeId: string;
    name: string;
    image?: string;
    shiftLabel?: string;
    inWork: number;
    delivered: number;
    onHand?: number;
}

export function useDeliveriesPage() {
    const { projectId, currency, can } = useProject();
    const canManage = can(Permission.MANAGE_DELIVERIES);
    const canFinance = can(Permission.VIEW_FINANCES);

    const [mode, setMode] = useQueryState(
        'view',
        parseAsStringLiteral(MODE_VALUES).withDefault('couriers'),
    );

    const [range] = useState(() => {
        const from = startOfDay(new Date());

        return { from, to: addDays(from, 1) };
    });

    const query = useDeliveries({ projectId, ...range });
    const employeesQuery = useProjectEmployees({ projectId });
    const cashQuery = useCashSummary(canFinance ? projectId : '');

    const assign = useAssignDelivery(projectId);
    const requeue = useRequeueDelivery(projectId);
    const cancel = useCancelDelivery(projectId);

    const all = query.data ?? [];

    const courierDeliveries = all.filter(
        (delivery) => delivery.kind === DeliveryKind.COURIER,
    );

    const carrierDeliveries = all.filter(
        (delivery) => delivery.kind === DeliveryKind.CARRIER,
    );

    const queued = byDeliveryStatus(courierDeliveries, [DeliveryStatus.QUEUED]);

    const assigned = byDeliveryStatus(courierDeliveries, [
        DeliveryStatus.ASSIGNED,
    ]);

    const picked = byDeliveryStatus(courierDeliveries, [
        DeliveryStatus.PICKED_UP,
    ]);

    const delivered = byDeliveryStatus(courierDeliveries, [
        DeliveryStatus.DELIVERED,
    ]);

    const columns = [
        {
            key: 'queued',
            title: 'В очереди',
            tone: 'bg-zinc-400',
            items: queued,
        },
        {
            key: 'assigned',
            title: 'Назначены',
            tone: 'bg-blue-500',
            items: assigned,
        },
        { key: 'picked', title: 'В пути', tone: 'bg-amber-500', items: picked },
        {
            key: 'done',
            title: 'Доставлено и проблемы',
            tone: 'bg-green-600',
            items: byDeliveryStatus(courierDeliveries, [
                DeliveryStatus.FAILED,
                DeliveryStatus.DELIVERED,
            ]),
        },
    ];

    const cashCouriers = cashQuery.data?.couriers ?? [];

    const onHandById = new Map(
        cashCouriers.map((row) => [row.employeeId, row.onHand]),
    );

    const couriers: CourierRow[] = (employeesQuery.data ?? [])
        .filter((employee) => employee.kind === EmployeeKind.COURIER)
        .map((employee) => {
            const own = courierDeliveries.filter(
                (delivery) => delivery.courierId === employee.employeeId,
            );

            return {
                employeeId: employee.employeeId,
                name: employee.name,
                image: employee.image,
                shiftLabel: employee.today
                    ? fmtTimeRange(
                          employee.today.startsAt,
                          employee.today.endsAt,
                      )
                    : undefined,
                inWork: own.filter((delivery) =>
                    IN_WORK_DELIVERY_STATUSES.includes(delivery.status),
                ).length,
                delivered: byDeliveryStatus(own, [DeliveryStatus.DELIVERED])
                    .length,
                onHand: canFinance
                    ? (onHandById.get(employee.employeeId) ?? 0)
                    : undefined,
            };
        });

    const stats: StatItem[] = [
        { label: 'В очереди', value: queued.length },
        { label: 'Назначены', value: assigned.length },
        { label: 'В пути', value: picked.length },
        { label: 'Доставлено сегодня', value: delivered.length },
    ];

    if (canFinance) {
        const onHandTotal = cashCouriers.reduce(
            (sum, row) => sum + row.onHand,
            0,
        );

        stats.push({
            label: 'На руках у курьеров',
            value: fmtMoney(onHandTotal, currency),
        });
    }

    return {
        projectId,
        currency,
        query,
        mode,
        setMode: (next: DeliveriesMode) =>
            void setMode(next === 'couriers' ? null : next),
        stats,
        columns,
        carrierDeliveries,
        couriers,
        courierOptions: employeeOptions(couriers),
        canManage,
        onAssign: (delivery: DeliveryView, courierId: string) =>
            runAction(
                assign.mutateAsync({ projectId, id: delivery.id, courierId }),
                {
                    success: 'Курьер назначен',
                },
            ),
        onRequeue: (delivery: DeliveryView) =>
            runAction(requeue.mutateAsync({ projectId, id: delivery.id }), {
                success: 'Вернули в очередь',
            }),
        onCancel: (delivery: DeliveryView) =>
            runAction(cancel.mutateAsync({ projectId, id: delivery.id }), {
                success: 'Доставка отменена',
            }),
    };
}
