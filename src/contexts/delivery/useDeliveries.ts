'use client';

import { itemQuery } from '@/shared/lib/queries';
import { defineResource } from '@/shared/lib/resource';
import { useQuery } from '@tanstack/react-query';
import {
    courierStatsAction,
    createDeliveryAction,
    deliveriesAction,
    orderDeliveryAction,
    updateDeliveryAction,
} from './Delivery.actions';
import {
    completeDeliveryAction,
    failDeliveryAction,
    pickUpDeliveryAction,
    takeDeliveryAction,
} from './DeliveryCourier.actions';
import {
    assignDeliveryAction,
    cancelDeliveryAction,
    requeueDeliveryAction,
    setCarrierStatusAction,
} from './DeliveryStatus.actions';

interface ListOptions {
    projectId: string;
    from?: Date;
    to?: Date;
}

interface CourierStatsOptions {
    projectId: string;
    from: Date;
    to: Date;
}

const deliveries = defineResource({
    key: ['deliveries'],
    list: {
        action: deliveriesAction,
        input: ({ projectId, from, to }: ListOptions) => ({
            projectId,
            from,
            to,
        }),
    },
    mutations: {
        useCreateDelivery: createDeliveryAction,
        useUpdateDelivery: updateDeliveryAction,
        useAssignDelivery: assignDeliveryAction,
        useTakeDelivery: takeDeliveryAction,
        usePickUpDelivery: pickUpDeliveryAction,
        useCompleteDelivery: completeDeliveryAction,
        useFailDelivery: failDeliveryAction,
        useRequeueDelivery: requeueDeliveryAction,
        useCancelDelivery: cancelDeliveryAction,
        useSetCarrierStatus: setCarrierStatusAction,
    },
});

const courierStats = defineResource({
    key: ['deliveries', 'courier-stats'],
    list: {
        action: courierStatsAction,
        input: (opts: CourierStatsOptions) => opts,
    },
});

export const { useList: useDeliveries } = deliveries;
export const { useList: useCourierStats } = courierStats;

export const useOrderDelivery = (projectId: string, orderId: string) => {
    return useQuery(
        itemQuery(['deliveries', 'order', projectId, orderId], () =>
            orderDeliveryAction({ projectId, orderId }),
        ),
    );
};

export const {
    mutations: {
        useCreateDelivery,
        useUpdateDelivery,
        useAssignDelivery,
        useTakeDelivery,
        usePickUpDelivery,
        useCompleteDelivery,
        useFailDelivery,
        useRequeueDelivery,
        useCancelDelivery,
        useSetCarrierStatus,
    },
} = deliveries;
