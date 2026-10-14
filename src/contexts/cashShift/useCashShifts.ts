'use client';

import { makeScopedMutation } from '@/shared/lib/mutations';
import { itemQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    acceptCourierCashAction,
    cashRegisterSummaryAction,
    closeCashShiftAction,
    myCourierCashAction,
    openCashShiftAction,
    recordCashCollectionAction,
} from './CashShift.actions';

const cashQueries = {
    all: ['cash-register'] as const,
    summary: (projectId: string) =>
        itemQuery(
            [...cashQueries.all, 'summary', projectId],
            () => cashRegisterSummaryAction({ projectId }),
            { enabled: projectId.length > 0, staleTime: 10_000 },
        ),
};

export function useCashSummary(projectId: string) {
    return useQuery(cashQueries.summary(projectId));
}

export function useMyCourierCash(projectId: string, enabled = true) {
    return useQuery(
        itemQuery(
            [...cashQueries.all, 'mine', projectId],
            () => myCourierCashAction({ projectId }),
            { enabled: enabled && projectId.length > 0 },
        ),
    );
}

export const useAcceptCourierCash = makeScopedMutation(acceptCourierCashAction);

export const useOpenCashShift = makeScopedMutation(openCashShiftAction);
export const useCloseCashShift = makeScopedMutation(closeCashShiftAction);
export const useRecordCashCollection = makeScopedMutation(
    recordCashCollectionAction,
);
