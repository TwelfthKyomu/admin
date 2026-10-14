'use client';

import { useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { type DeliveryView, useFailDelivery } from '@/contexts/delivery';
import { Input } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import { FailDeliveryFormSchema, type FailDeliveryFormValues } from '../form/formData';

interface FailDeliveryModalProps {
    projectId: string;
    delivery: DeliveryView;
}

export const DeliveryFailModal = ({ projectId, delivery }: FailDeliveryModalProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useFailDelivery(projectId);

    const form = useForm<FailDeliveryFormValues>({
        resolver: zodResolver(FailDeliveryFormSchema),
        defaultValues: { reason: '' },
    });

    const submit = async (values: FailDeliveryFormValues) => {
        const { success } = await runAction(
            mutateAsync({ projectId, id: delivery.id, reason: values.reason.trim() }),
            { success: 'Отметили: не доставлено. Диспетчер решит, что дальше' },
        );

        if (success) close();
    };

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
