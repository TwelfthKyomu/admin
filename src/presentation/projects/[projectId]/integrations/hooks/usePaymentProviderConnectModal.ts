'use client';

import { useForm, useWatch } from 'react-hook-form';
import { PAYMENT_PROVIDER_LABEL } from '@/shared/labels/payment';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    type PaymentProvider,
    useConnectPaymentProvider,
} from '@/contexts/paymentIntent';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    CONNECT_PROVIDER_DEFAULT,
    ConnectPaymentProviderFormSchema,
    type ConnectPaymentProviderFormValues,
} from '../form/formData';
import { buildProviderPayload } from '../lib/providerPayload';

export const usePaymentProviderConnectModal = (projectId: string) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useConnectPaymentProvider();

    const form = useForm<ConnectPaymentProviderFormValues>({
        resolver: zodResolver(ConnectPaymentProviderFormSchema),
        defaultValues: CONNECT_PROVIDER_DEFAULT,
    });

    const provider = useWatch({ control: form.control, name: 'provider' });

    const onProviderChange = (next: PaymentProvider) => {
        if (form.formState.dirtyFields.name) return;

        form.setValue('name', PAYMENT_PROVIDER_LABEL[next]);
    };

    const onSubmit = async (values: ConnectPaymentProviderFormValues) => {
        const { success } = await runAction(
            mutateAsync({
                projectId,
                name: values.name.trim(),
                provider: values.provider,
                payload: buildProviderPayload(values),
            }),
            { success: `Провайдер «${values.name.trim()}» подключён` },
        );

        if (success) close();
    };

    return { close, isPending, form, provider, onProviderChange, onSubmit };
};
