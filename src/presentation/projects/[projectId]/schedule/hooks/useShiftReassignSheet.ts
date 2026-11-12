'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    ReassignShiftActionInputSchema,
    type ReassignShiftFormValues,
    useReassignShift,
} from '@/contexts/employeeShift';
import { zodResolver } from '@hookform/resolvers/zod';

export const useShiftReassignSheet = (projectId: string, shiftId: string) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useReassignShift();

    const form = useForm<ReassignShiftFormValues>({
        values: {
            id: shiftId,
            projectId,
            substituteEmployeeId: '',
            reason: '',
        },
        resolver: zodResolver(ReassignShiftActionInputSchema),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<ReassignShiftFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: 'Замена назначена: доставки из окна смены перешли замене',
        });

        if (success) close();
    };

    return { isPending, form, onSubmit };
};
