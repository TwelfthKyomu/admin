'use client';

import { FormDialog } from '@/shared/components/common';
import type { DeliveryView } from '@/contexts/delivery';
import { Input } from '@/ui/Controlled';
import type { FailDeliveryFormValues } from '../form/formData';
import { useDeliveryFailModal } from '../hooks/useDeliveryFailModal';

interface FailDeliveryModalProps {
    projectId: string;
    delivery: DeliveryView;
}

export const DeliveryFailModal = ({ projectId, delivery }: FailDeliveryModalProps) => {
    const { isPending, form, submit } = useDeliveryFailModal(projectId, delivery);

    return (
        <FormDialog
            title="Не доставлено"
            description={delivery.address ?? undefined}
            className="max-w-sm"
            bodyClassName="grid gap-3"
            form={form}
            onSubmit={submit}
            submitLabel="Отметить"
            submitVariant="destructive"
            requireDirty={false}
            busy={isPending}
        >
            <Input<FailDeliveryFormValues>
                name="reason"
                label="Причина"
                placeholder="Не открыли дверь, неверный адрес…"
                autoFocus
            />
        </FormDialog>
    );
};
