'use client';

import { FormDialog } from '@/shared/components/common';
import { CURRENCY_SYMBOL } from '@/shared/constants/currency';
import { REASON_MAX } from '@/shared/constants/default';
import { PAYMENT_METHOD_OPTIONS, type PaymentModalMode } from '@/shared/labels/payment';
import type { OrderView } from '@/contexts/order';
import type { PaymentMethod } from '@/contexts/payment';
import { Input, Money, Select } from '@/ui/Controlled';
import type { PaymentFormValues } from '../form/formData';
import { usePaymentModal } from '../hooks/usePaymentModal';

interface PaymentModalProps {
    projectId: string;
    order: OrderView;
    mode: PaymentModalMode;
    maxAmount: number;
}

export const PaymentModal = ({ projectId, order, mode, maxAmount }: PaymentModalProps) => {
    const { recordPayment, recordRefund, meta, isRefund, max, form, method, submit } =
        usePaymentModal({ projectId, order, mode, maxAmount });

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
