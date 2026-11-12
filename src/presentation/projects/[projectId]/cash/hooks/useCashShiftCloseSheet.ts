'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    CloseCashShiftActionInputSchema,
    useCloseCashShift,
} from '@/contexts/cashShift';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CloseCashShiftFormValues } from '../form/formData';

export const useCashShiftCloseSheet = (projectId: string) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCloseCashShift();

    const form = useForm<CloseCashShiftFormValues>({
        resolver: zodResolver(CloseCashShiftActionInputSchema),
        values: { projectId, countedAmount: 0, note: '' },
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<CloseCashShiftFormValues> = async (
        values,
    ) => {
        const { success } = await runAction(mutateAsync(values), {
            success: 'Смена закрыта',
        });

        if (success) close();
    };

    return { isPending, form, onSubmit };
};
