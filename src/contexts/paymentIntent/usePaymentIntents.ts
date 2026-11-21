'use client';

import { defineResource } from '@/shared/lib/resource';
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

const payments = defineResource({
    key: ['payments'],
    list: {
        action: paymentIntentsAction,
        input: ({ projectId, orderId }: ListOptions) => ({
            projectId,
            orderId,
        }),
        enabled: ({ projectId }: ListOptions) => projectId.length > 0,
        staleTime: 5_000,
    },
    mutations: {
        useConnectPaymentProvider: connectPaymentProviderAction,
        useCreatePaymentIntent: createPaymentIntentAction,
        useRefundUnappliedIntent: refundUnappliedIntentAction,
    },
});

export const {
    useList: usePaymentIntentsList,
    mutations: {
        useConnectPaymentProvider,
        useCreatePaymentIntent,
        useRefundUnappliedIntent,
    },
} = payments;
