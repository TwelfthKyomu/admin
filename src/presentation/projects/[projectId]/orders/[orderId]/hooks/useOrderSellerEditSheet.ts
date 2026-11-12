'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { type OrderView, useChangeOrderSeller } from '@/contexts/order';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    NO_SELLER,
    OrderSellerFormSchema,
    type OrderSellerFormValues,
} from '../form/formData';

export const useOrderSellerEditSheet = (
    projectId: string,
    order: OrderView,
) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useChangeOrderSeller();

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
                sellerId:
                    values.sellerId === NO_SELLER ? null : values.sellerId,
            }),
            { success: 'Продавец изменён' },
        );

        if (success) close();
    };

    return { isPending, form, onSubmit };
};
