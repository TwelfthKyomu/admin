'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { fmtMoney } from '@/shared/format/money';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { CloseCashShiftActionInputSchema, useCloseCashShift } from '@/contexts/cashShift';
import { Input, Money } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import type { CloseCashShiftFormValues } from '../form/formData';

interface CloseShiftSheetProps {
    projectId: string;
    expectedCash: number;
}

export const CashShiftCloseSheet = ({ projectId, expectedCash }: CloseShiftSheetProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCloseCashShift(projectId);

    const form = useForm<CloseCashShiftFormValues>({
        resolver: zodResolver(CloseCashShiftActionInputSchema),
        values: { projectId, countedAmount: 0, note: '' },
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<CloseCashShiftFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: 'Смена закрыта',
        });

        if (success) close();
    };

    return (
        <FormDialog
            surface="sheet"
            title="Закрыть смену"
            description={`Ожидаемый остаток в кассе: ${fmtMoney(expectedCash)}. Введите фактически пересчитанную сумму.`}
            form={form}
            onSubmit={onSubmit}
            submitLabel="Закрыть смену"
            requireValid={false}
            requireDirty={false}
            busy={isPending}
        >
            <Money
                name="countedAmount"
                label="Фактический остаток"
                placeholder="0,00"
            />
            <Input
                name="note"
                label="Комментарий"
                placeholder="Напр. расхождение по причине…"
            />
        </FormDialog>
    );
};
