'use client';

import { makeScopedMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    connectPaymentProviderAction,
    createPaymentIntentAction,
    paymentIntentsAction,
    refundUnappliedIntentAction,
} from './PaymentIntent.actions';

interface ListOptions {
    projectId: string;
    orderId?: string;
}

const paymentQueries = {
    all: ['payments'] as const,
    list: ({ projectId, orderId }: ListOptions) =>
        listQuery(
            [...paymentQueries.all, 'list', projectId, orderId ?? ''],
            () => paymentIntentsAction({ projectId, orderId }),
            { enabled: projectId.length > 0, staleTime: 5_000 },
        ),
};

export function usePaymentIntentsList(opts: ListOptions) {
    return useQuery(paymentQueries.list(opts));
}

export const useConnectPaymentProvider = makeScopedMutation(
    connectPaymentProviderAction,
);
export const useCreatePaymentIntent = makeScopedMutation(
    createPaymentIntentAction,
);
export const useRefundUnappliedIntent = makeScopedMutation(
    refundUnappliedIntentAction,
);
