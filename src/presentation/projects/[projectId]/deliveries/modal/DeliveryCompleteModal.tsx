'use client';

import { useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { fmtMoney } from '@/shared/format/money';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { type DeliveryView, useCompleteDelivery } from '@/contexts/delivery';
import { PaymentMethod } from '@/contexts/payment';
import { Money, Select } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    COMPLETE_METHOD_OPTIONS,
    CompleteDeliveryFormSchema,
    type CompleteDeliveryFormValues,
} from '../form/formData';

interface CompleteDeliveryModalProps {
    projectId: string;
    delivery: DeliveryView;
}

export const DeliveryCompleteModal = ({ projectId, delivery }: CompleteDeliveryModalProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCompleteDelivery(projectId);
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

    return (
        <FormDialog
            title="Доставлено — принять оплату"
            description={`${delivery.address ?? 'Заказ'} · к оплате у двери ${fmtMoney(delivery.cashDue, delivery.currency)}`}
            className="max-w-sm"
            bodyClassName="grid gap-3"
            form={form}
            onSubmit={submit}
            submitLabel="Доставлено"
            requireValid={false}
            requireDirty={false}
            busy={isPending}
        >
            <Money<CompleteDeliveryFormValues>
                name="amount"
                label="Принято"
                autoFocus
            />
            <Select<CompleteDeliveryFormValues, 'method', 'cash' | 'card'>
                name="method"
                label="Как оплатили"
                options={COMPLETE_METHOD_OPTIONS}
            />
        </FormDialog>
    );
};
