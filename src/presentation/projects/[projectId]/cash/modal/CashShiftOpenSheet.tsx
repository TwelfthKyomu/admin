'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { OpenCashShiftActionInputSchema, useOpenCashShift } from '@/contexts/cashShift';
import { Money } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import type { OpenCashShiftFormValues } from '../form/formData';

export const CashShiftOpenSheet = ({ projectId }: { projectId: string }) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useOpenCashShift(projectId);

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

    return (
        <FormDialog
            surface="sheet"
            title="Открыть кассовую смену"
            description="Укажите начальный остаток наличных в кассе."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Открыть"
            requireValid={false}
            requireDirty={false}
            busy={isPending}
        >
            <Money
                name="openingAmount"
                label="Начальный остаток"
                placeholder="0,00"
            />
        </FormDialog>
    );
};
