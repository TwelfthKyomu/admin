'use client';

import { makeScopedMutation } from '@/shared/lib/mutations';
import { listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    deletePayoutAction,
    payrollPreviewAction,
    recordPayoutAction,
} from './Payout.actions';

interface PreviewOptions {
    projectId: string;
    from: Date;
    to: Date;
}

const payrollQueries = {
    all: ['payroll'] as const,
    preview: ({ projectId, from, to }: PreviewOptions) =>
        listQuery(
            [
                ...payrollQueries.all,
                'preview',
                projectId,
                from.toISOString(),
                to.toISOString(),
            ],
            () => payrollPreviewAction({ projectId, from, to }),
            { enabled: projectId.length > 0, staleTime: 10_000 },
        ),
};

export function usePayrollPreview(opts: PreviewOptions) {
    return useQuery(payrollQueries.preview(opts));
}

export const useRecordPayout = makeScopedMutation(recordPayoutAction);
export const useDeletePayout = makeScopedMutation(deletePayoutAction);
