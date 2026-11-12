'use client';

import { useForm } from 'react-hook-form';
import { fmtMoney } from '@/shared/format/money';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { type DeliveryView, useCompleteDelivery } from '@/contexts/delivery';
import { PaymentMethod } from '@/contexts/payment';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    CompleteDeliveryFormSchema,
    type CompleteDeliveryFormValues,
} from '../form/formData';

export const useDeliveryCompleteModal = (
    projectId: string,
    delivery: DeliveryView,
) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCompleteDelivery();
    const maxAmount = delivery.amountDue;

    const form = useForm<CompleteDeliveryFormValues>({
        resolver: zodResolver(CompleteDeliveryFormSchema),
        defaultValues: {
            amount: Math.min(delivery.cashDue, maxAmount),
            method: PaymentMethod.CASH,
        },
    });

    const submit = async (values: CompleteDeliveryFormValues) => {
        const amount = values.amount ?? 0;

        if (amount <= 0) {
            form.setError('amount', { message: 'Сколько взяли у двери?' });

            return;
        }

        if (amount > maxAmount) {
            form.setError('amount', {
                message: `Не больше остатка: ${fmtMoney(maxAmount, delivery.currency)}`,
            });

            return;
        }

        const { success } = await runAction(
            mutateAsync({
                projectId,
                id: delivery.id,
                payment: { amount, method: values.method },
            }),
            { success: 'Доставлено, оплата принята' },
        );

        if (success) close();
    };

    return { isPending, form, submit };
};
