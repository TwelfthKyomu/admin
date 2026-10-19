'use client';

import { FormDialog } from '@/shared/components/common';
import type { Currency } from '@/shared/constants/currency';
import { SaleForm } from '../form/SaleForm';
import { useCreateSale } from '../hooks/useCreateSale';

interface SaleCreateModalProps {
    projectId: string;
    currency: Currency;
}

export const SaleCreateModal = ({ projectId, currency }: SaleCreateModalProps) => {
    const { form, isPending, submit, ...formProps } = useCreateSale(projectId);

    return (
        <FormDialog
            title="Новая продажа"
            description="Товары и услуги. Оплату и купон можно внести в карточке заказа."
            className="max-w-xl"
            form={form}
            onSubmit={submit}
            submitLabel="Создать продажу"
            requireDirty={false}
            busy={isPending}
        >
            <SaleForm
                currency={currency}
                {...formProps}
            />
        </FormDialog>
    );
};
