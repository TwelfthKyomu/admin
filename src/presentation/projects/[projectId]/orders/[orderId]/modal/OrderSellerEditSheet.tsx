'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import type { Option } from '@/shared/types';
import { type OrderView, orderNumber, useChangeOrderSeller } from '@/contexts/order';
import { Select } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import { NO_SELLER, OrderSellerFormSchema, type OrderSellerFormValues } from '../form/formData';

interface OrderSellerEditSheetProps {
    projectId: string;
    order: OrderView;
    options: Option[];
}

export const OrderSellerEditSheet = ({ projectId, order, options }: OrderSellerEditSheetProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useChangeOrderSeller(projectId);

    const form = useForm<OrderSellerFormValues>({
        values: { sellerId: order.sellerId ?? NO_SELLER },
        resolver: zodResolver(OrderSellerFormSchema),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<OrderSellerFormValues> = async (values) => {
        const { success } = await runAction(
            mutateAsync({
                id: order.id,
                projectId,
                sellerId: values.sellerId === NO_SELLER ? null : values.sellerId,
            }),
            { success: 'Продавец изменён' },
        );

        if (success) close();
    };

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
