'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    RecordCashCollectionActionInputSchema,
    useRecordCashCollection,
} from '@/contexts/cashShift';
import { zodResolver } from '@hookform/resolvers/zod';
import type { RecordCashCollectionFormValues } from '../form/formData';

export const useCashCollectSheet = (projectId: string) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useRecordCashCollection();

    const form = useForm<RecordCashCollectionFormValues>({
        resolver: zodResolver(RecordCashCollectionActionInputSchema),
        values: { projectId, amount: 0, note: '' },
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<RecordCashCollectionFormValues> = async (
        values,
    ) => {
        const { success } = await runAction(mutateAsync(values), {
            success: 'Инкассация записана',
        });

        if (success) close();
    };

    return { isPending, form, onSubmit };
};
