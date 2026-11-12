'use client';

import { FormDialog } from '@/shared/components/common';
import type { Option } from '@/shared/types';
import { type OrderView, orderNumber } from '@/contexts/order';
import { Select } from '@/ui/Controlled';
import { NO_SELLER } from '../form/formData';
import { useOrderSellerEditSheet } from '../hooks/useOrderSellerEditSheet';

interface OrderSellerEditSheetProps {
    projectId: string;
    order: OrderView;
    options: Option[];
}

export const OrderSellerEditSheet = ({ projectId, order, options }: OrderSellerEditSheetProps) => {
    const { isPending, form, onSubmit } = useOrderSellerEditSheet(projectId, order);

    return (
        <FormDialog
            surface="sheet"
            title={`Продавец заказа ${orderNumber(order)}`}
            description="Продажа и процент с неё перейдут выбранному сотруднику."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Сохранить"
            busy={isPending}
        >
            <Select
                name="sellerId"
                label="Продавец"
                options={[{ value: NO_SELLER, label: 'Без продавца' }, ...options]}
            />
        </FormDialog>
    );
};
