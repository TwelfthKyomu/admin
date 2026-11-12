'use client';

import { FormDialog } from '@/shared/components/common';
import { Input, Money } from '@/ui/Controlled';
import { useCashCollectSheet } from '../hooks/useCashCollectSheet';

export const CashCollectSheet = ({ projectId }: { projectId: string }) => {
    const { isPending, form, onSubmit } = useCashCollectSheet(projectId);

    return (
        <FormDialog
            surface="sheet"
            title="Инкассация"
            description="Изъятие наличных из кассы. Уменьшает ожидаемый остаток."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Записать"
            requireDirty={false}
            busy={isPending}
        >
            <Money
                name="amount"
                label="Сумма изъятия"
                placeholder="0,00"
            />
            <Input
                name="note"
                label="Комментарий"
                placeholder="Напр. сдача в банк"
            />
        </FormDialog>
    );
};
