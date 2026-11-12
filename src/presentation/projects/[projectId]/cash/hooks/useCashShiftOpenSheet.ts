'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    OpenCashShiftActionInputSchema,
    useOpenCashShift,
} from '@/contexts/cashShift';
import { zodResolver } from '@hookform/resolvers/zod';
import type { OpenCashShiftFormValues } from '../form/formData';

export const useCashShiftOpenSheet = (projectId: string) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useOpenCashShift();

    const form = useForm<OpenCashShiftFormValues>({
        resolver: zodResolver(OpenCashShiftActionInputSchema),
        values: { projectId, openingAmount: 0 },
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<OpenCashShiftFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: 'Смена открыта',
        });

        if (success) close();
    };

    return { isPending, form, onSubmit };
};
