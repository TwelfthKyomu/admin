'use client';

import { useState } from 'react';
import { useProject, useStaticData } from '@/app/providers';
import { runAction } from '@/shared/lib/action-result';
import { modal } from '@/shared/lib/modal';
import { useMyCourierCash } from '@/contexts/cashShift';
import {
    DeliveryStatus,
    type DeliveryView,
    FINISHED_DELIVERY_STATUSES,
    IN_WORK_DELIVERY_STATUSES,
    useCompleteDelivery,
    useDeliveries,
    usePickUpDelivery,
    useTakeDelivery,
} from '@/contexts/delivery';
import { useProjectEmployees } from '@/contexts/employeeAssignment';
import { addDays, startOfDay } from 'date-fns';
import dynamic from 'next/dynamic';
import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { byDeliveryWindow } from '../lib/deliveries';

const DeliveryCompleteModal = dynamic(() =>
    import('../modal/DeliveryCompleteModal').then((m) => m.DeliveryCompleteModal),
);

const DeliveryFailModal = dynamic(() =>
    import('../modal/DeliveryFailModal').then((m) => m.DeliveryFailModal),
);

const TAB_VALUES = ['now', 'queue', 'done'] as const;

export type CourierTab = (typeof TAB_VALUES)[number];

export function useCourierDeliveries() {
    const { projectId, currency } = useProject();
    const { user } = useStaticData();
    const [tab, setTab] = useQueryState('tab', parseAsStringLiteral(TAB_VALUES).withDefault('now'));

    const [range] = useState(() => {
        const from = startOfDay(new Date());

        return { from, to: addDays(from, 1) };
    });

    const deliveriesQuery = useDeliveries({ projectId, ...range });
    const employeesQuery = useProjectEmployees({ projectId });
    const cashQuery = useMyCourierCash(projectId);
    const take = useTakeDelivery(projectId);
    const pickUp = usePickUpDelivery(projectId);
    const complete = useCompleteDelivery(projectId);

    const me = (employeesQuery.data ?? []).find((employee) => employee.userId === user.id);
    const all = deliveriesQuery.data ?? [];
    const mine = all.filter((delivery) => me && delivery.courierId === me.employeeId);

    const lists: Record<CourierTab, DeliveryView[]> = {
        now: mine
            .filter((delivery) => IN_WORK_DELIVERY_STATUSES.includes(delivery.status))
            .sort((a, b) => {
                if (a.status !== b.status) return a.status === DeliveryStatus.PICKED_UP ? -1 : 1;

                return byDeliveryWindow(a, b);
            }),
        queue: all
            .filter((delivery) => delivery.status === DeliveryStatus.QUEUED)
            .sort(byDeliveryWindow),
        done: mine
            .filter((delivery) => FINISHED_DELIVERY_STATUSES.includes(delivery.status))
            .sort((a, b) => byDeliveryWindow(b, a)),
    };

    const onDelivered = (delivery: DeliveryView) => {
        if (delivery.cashDue > 0) {
            modal.open(
                <DeliveryCompleteModal
                    projectId={projectId}
                    delivery={delivery}
                />,
            );

            return;
        }

        void runAction(complete.mutateAsync({ projectId, id: delivery.id }), {
            success: 'Доставлено',
        });
    };

    const onFailed = (delivery: DeliveryView) =>
        modal.open(
            <DeliveryFailModal
                projectId={projectId}
                delivery={delivery}
            />,
        );

    return {
        currency,
        tab,
        setTab: (next: CourierTab) => void setTab(next === 'now' ? null : next),
        lists,
        me,
        onHand: cashQuery.data ?? 0,
        isLoading: deliveriesQuery.isLoading || employeesQuery.isLoading,
        isBusy: take.isPending || pickUp.isPending || complete.isPending,
        onTake: (delivery: DeliveryView) =>
            runAction(take.mutateAsync({ projectId, id: delivery.id }), {
                success: 'Доставка ваша',
            }),
        onPickUp: (delivery: DeliveryView) =>
            runAction(pickUp.mutateAsync({ projectId, id: delivery.id }), {
                success: 'Забрали — в пути',
            }),
        onDelivered,
        onFailed,
    };
}
