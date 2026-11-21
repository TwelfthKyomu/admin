'use client';

import { defineResource } from '@/shared/lib/resource';
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

const payroll = defineResource({
    key: ['payroll'],
    list: {
        action: payrollPreviewAction,
        input: (opts: PreviewOptions) => opts,
        enabled: ({ projectId }: PreviewOptions) => projectId.length > 0,
        staleTime: 10_000,
    },
    mutations: {
        useRecordPayout: recordPayoutAction,
        useDeletePayout: deletePayoutAction,
    },
});

export const {
    useList: usePayrollPreview,
    mutations: { useRecordPayout, useDeletePayout },
} = payroll;
