'use client';

import { makeMutation } from '@/shared/lib/mutations';
import { itemQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    purchasePlanAction,
    subscriptionStatusAction,
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

export function useSubscriptionStatus() {
    return useQuery(subscriptionQueries.status());
}

export const usePurchasePlan = makeMutation(purchasePlanAction);
