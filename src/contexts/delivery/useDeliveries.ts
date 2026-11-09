'use client';

import { makeMutation } from '@/shared/lib/mutations';
import { itemQuery, listQuery } from '@/shared/lib/queries';
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

const deliveryQueries = {
    all: ['deliveries'] as const,
    list: (projectId: string, from?: Date, to?: Date) =>
        listQuery(
            [
                ...deliveryQueries.all,
                'list',
                projectId,
                from?.toISOString() ?? '',
                to?.toISOString() ?? '',
            ],
            () => deliveriesAction({ projectId, from, to }),
        ),
    order: (projectId: string, orderId: string) =>
        itemQuery([...deliveryQueries.all, 'order', projectId, orderId], () =>
            orderDeliveryAction({ projectId, orderId }),
        ),
};

export function useDeliveries(opts: {
    projectId: string;
    from?: Date;
    to?: Date;
}) {
    return useQuery(deliveryQueries.list(opts.projectId, opts.from, opts.to));
}

export function useCourierStats(opts: {
    projectId: string;
    from: Date;
    to: Date;
}) {
    return useQuery(
        listQuery(
            [
                ...deliveryQueries.all,
                'courier-stats',
                opts.projectId,
                opts.from.toISOString(),
                opts.to.toISOString(),
            ],
            () => courierStatsAction(opts),
        ),
    );
}

export function useOrderDelivery(projectId: string, orderId: string) {
    return useQuery(deliveryQueries.order(projectId, orderId));
}

export const useCreateDelivery = makeMutation(createDeliveryAction);
export const useUpdateDelivery = makeMutation(updateDeliveryAction);
export const useAssignDelivery = makeMutation(assignDeliveryAction);
export const useTakeDelivery = makeMutation(takeDeliveryAction);
export const usePickUpDelivery = makeMutation(pickUpDeliveryAction);
export const useCompleteDelivery = makeMutation(completeDeliveryAction);
export const useFailDelivery = makeMutation(failDeliveryAction);
export const useRequeueDelivery = makeMutation(requeueDeliveryAction);
export const useCancelDelivery = makeMutation(cancelDeliveryAction);
export const useSetCarrierStatus = makeMutation(setCarrierStatusAction);
