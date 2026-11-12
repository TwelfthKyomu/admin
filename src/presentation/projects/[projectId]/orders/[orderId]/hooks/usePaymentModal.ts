'use client';

import { useForm, useWatch } from 'react-hook-form';
import { fmtMoney } from '@/shared/format/money';
import {
    PAYMENT_DIALOG_LABEL,
    type PaymentModalMode,
} from '@/shared/labels/payment';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    type OrderView,
    useRecordOrderPayment,
    useRecordOrderRefund,
} from '@/contexts/order';
import { PaymentMethod } from '@/contexts/payment';
import { zodResolver } from '@hookform/resolvers/zod';
import { PaymentFormSchema, type PaymentFormValues } from '../form/formData';

export const usePaymentModal = ({
    projectId,
    order,
    mode,
    maxAmount,
}: {
    projectId: string;
    order: OrderView;
    mode: PaymentModalMode;
    maxAmount: number;
}) => {
    const close = useModalClose();
    const recordPayment = useRecordOrderPayment();
    const recordRefund = useRecordOrderRefund();
    const meta = PAYMENT_DIALOG_LABEL[mode];
    const isRefund = mode === 'refund';
    const max = fmtMoney(maxAmount, order.currency);

    const form = useForm<PaymentFormValues>({
        resolver: zodResolver(PaymentFormSchema),
        defaultValues: {
            amount: maxAmount,
            method: PaymentMethod.CASH,
            reason: '',
        },
    });

    const method = useWatch({ control: form.control, name: 'method' });

    const submit = async (values: PaymentFormValues) => {
        const amount = values.amount ?? 0;

        if (amount > maxAmount) {
            form.setError('amount', { message: `Максимум ${max}` });

            return;
        }

        const input = {
            id: order.id,
            projectId,
            amount,
            method: values.method,
        };

        const reason = values.reason?.trim() || undefined;

        const { success } = await runAction(
            isRefund
                ? recordRefund.mutateAsync({ ...input, reason })
                : recordPayment.mutateAsync(input),
            { success: `${meta.success} ${fmtMoney(amount, order.currency)}` },
        );

        if (success) close();
    };

    return {
        recordPayment,
        recordRefund,
        meta,
        isRefund,
        max,
        form,
        method,
        submit,
    };
};
