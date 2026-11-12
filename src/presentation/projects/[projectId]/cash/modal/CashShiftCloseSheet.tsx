'use client';

import { FormDialog } from '@/shared/components/common';
import { fmtMoney } from '@/shared/format/money';
import { Input, Money } from '@/ui/Controlled';
import { useCashShiftCloseSheet } from '../hooks/useCashShiftCloseSheet';

interface CloseShiftSheetProps {
    projectId: string;
    expectedCash: number;
}

export const CashShiftCloseSheet = ({ projectId, expectedCash }: CloseShiftSheetProps) => {
    const { isPending, form, onSubmit } = useCashShiftCloseSheet(projectId);

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
