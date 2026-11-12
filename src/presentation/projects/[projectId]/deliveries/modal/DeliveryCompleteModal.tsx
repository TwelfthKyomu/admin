'use client';

import { FormDialog } from '@/shared/components/common';
import { fmtMoney } from '@/shared/format/money';
import type { DeliveryView } from '@/contexts/delivery';
import { Money, Select } from '@/ui/Controlled';
import { COMPLETE_METHOD_OPTIONS, type CompleteDeliveryFormValues } from '../form/formData';
import { useDeliveryCompleteModal } from '../hooks/useDeliveryCompleteModal';

interface CompleteDeliveryModalProps {
    projectId: string;
    delivery: DeliveryView;
}

export const DeliveryCompleteModal = ({ projectId, delivery }: CompleteDeliveryModalProps) => {
    const { isPending, form, submit } = useDeliveryCompleteModal(projectId, delivery);

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
