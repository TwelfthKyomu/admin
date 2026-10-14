'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    RecordCashCollectionActionInputSchema,
    useRecordCashCollection,
} from '@/contexts/cashShift';
import { Input, Money } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import type { RecordCashCollectionFormValues } from '../form/formData';

export const CashCollectSheet = ({ projectId }: { projectId: string }) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useRecordCashCollection(projectId);

    const form = useForm<RecordCashCollectionFormValues>({
        resolver: zodResolver(RecordCashCollectionActionInputSchema),
        values: { projectId, amount: 0, note: '' },
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<RecordCashCollectionFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: 'Инкассация записана',
        });

        if (success) close();
    };

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
