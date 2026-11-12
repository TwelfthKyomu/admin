'use client';

import { makeMutation } from '@/shared/lib/mutations';
import { itemQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    completeTestBillingPaymentAction,
    purchasePlanAction,
    subscriptionStatusAction,
    syncBillingPaymentAction,
} from './Subscription.actions';

const subscriptionQueries = {
    all: ['subscription'] as const,
    status: () =>
        itemQuery(
            [...subscriptionQueries.all, 'status'],
            () => subscriptionStatusAction(),
            { staleTime: 0 },
        ),
};

export const useSubscriptionStatus = () => {
    return useQuery(subscriptionQueries.status());
};

export const usePurchasePlan = makeMutation(purchasePlanAction);
export const useSyncBillingPayment = makeMutation(syncBillingPaymentAction);
export const useCompleteTestBillingPayment = makeMutation(
    completeTestBillingPaymentAction,
);
