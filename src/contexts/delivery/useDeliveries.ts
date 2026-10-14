'use client';

import { makeScopedMutation } from '@/shared/lib/mutations';
import { itemQuery, listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    assignDeliveryAction,
    cancelDeliveryAction,
    courierStatsAction,
    createDeliveryAction,
    deliveriesAction,
    orderDeliveryAction,
    requeueDeliveryAction,
    setCarrierStatusAction,
    updateDeliveryAction,
} from './Delivery.actions';
import {
    completeDeliveryAction,
    failDeliveryAction,
    pickUpDeliveryAction,
    takeDeliveryAction,
} from './DeliveryCourier.actions';

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

export const useCreateDelivery = makeScopedMutation(createDeliveryAction);
export const useUpdateDelivery = makeScopedMutation(updateDeliveryAction);
export const useAssignDelivery = makeScopedMutation(assignDeliveryAction);
export const useTakeDelivery = makeScopedMutation(takeDeliveryAction);
export const usePickUpDelivery = makeScopedMutation(pickUpDeliveryAction);
export const useCompleteDelivery = makeScopedMutation(completeDeliveryAction);
export const useFailDelivery = makeScopedMutation(failDeliveryAction);
export const useRequeueDelivery = makeScopedMutation(requeueDeliveryAction);
export const useCancelDelivery = makeScopedMutation(cancelDeliveryAction);
export const useSetCarrierStatus = makeScopedMutation(setCarrierStatusAction);
