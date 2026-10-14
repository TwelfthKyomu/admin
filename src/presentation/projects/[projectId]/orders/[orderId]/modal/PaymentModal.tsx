'use client';

import { useForm, useWatch } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { CURRENCY_SYMBOL } from '@/shared/constants/currency';
import { REASON_MAX } from '@/shared/constants/default';
import { fmtMoney } from '@/shared/format/money';
import {
    PAYMENT_DIALOG_LABEL,
    PAYMENT_METHOD_OPTIONS,
    type PaymentModalMode,
} from '@/shared/labels/payment';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { type OrderView, useRecordOrderPayment, useRecordOrderRefund } from '@/contexts/order';
import { PaymentMethod } from '@/contexts/payment';
import { Input, Money, Select } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import { PaymentFormSchema, type PaymentFormValues } from '../form/formData';

interface PaymentModalProps {
    projectId: string;
    order: OrderView;
    mode: PaymentModalMode;
    maxAmount: number;
}

export const PaymentModal = ({ projectId, order, mode, maxAmount }: PaymentModalProps) => {
    const close = useModalClose();
    const recordPayment = useRecordOrderPayment(projectId);
    const recordRefund = useRecordOrderRefund(projectId);
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

        const input = { id: order.id, projectId, amount, method: values.method };
        const reason = values.reason?.trim() || undefined;

        const { success } = await runAction(
            isRefund
                ? recordRefund.mutateAsync({ ...input, reason })
                : recordPayment.mutateAsync(input),
            { success: `${meta.success} ${fmtMoney(amount, order.currency)}` },
        );

        if (success) close();
    };

    return (
        <FormDialog
            title={meta.title}
            description={meta.description}
            className="max-w-md"
            bodyClassName="grid gap-3"
            form={form}
            onSubmit={submit}
            submitLabel={meta.submit}
            submitVariant={meta.submitVariant}
            requireValid={false}
            requireDirty={false}
            busy={recordPayment.isPending || recordRefund.isPending}
        >
            <Money<PaymentFormValues>
                name="amount"
                label={`Сумма, ${CURRENCY_SYMBOL[order.currency]}`}
                autoFocus
                description={`${meta.amountHint}: ${max}`}
            />
            <Select<PaymentFormValues, 'method', PaymentMethod>
                name="method"
                label={meta.methodLabel}
                description={method && meta.methodHint[method]}
                options={PAYMENT_METHOD_OPTIONS}
            />
            {isRefund && (
                <Input<PaymentFormValues>
                    name="reason"
                    label="Причина (необязательно)"
                    placeholder="Например: товар не подошёл"
                    maxLength={REASON_MAX}
                />
            )}
        </FormDialog>
    );
};
