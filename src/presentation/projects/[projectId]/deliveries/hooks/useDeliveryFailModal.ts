'use client';

import { useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { type DeliveryView, useFailDelivery } from '@/contexts/delivery';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    FailDeliveryFormSchema,
    type FailDeliveryFormValues,
} from '../form/formData';

export const useDeliveryFailModal = (
    projectId: string,
    delivery: DeliveryView,
) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useFailDelivery();

    const form = useForm<FailDeliveryFormValues>({
        resolver: zodResolver(FailDeliveryFormSchema),
        defaultValues: { reason: '' },
    });

    const submit = async (values: FailDeliveryFormValues) => {
        const { success } = await runAction(
            mutateAsync({
                projectId,
                id: delivery.id,
                reason: values.reason.trim(),
            }),
            { success: 'Отметили: не доставлено. Диспетчер решит, что дальше' },
        );

        if (success) close();
    };

    return { isPending, form, submit };
};
