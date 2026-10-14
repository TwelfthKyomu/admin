'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ROUTES } from '@/shared/constants';
import { absoluteUrl } from '@/shared/format/url';
import { runAction } from '@/shared/lib/action-result';
import { toast } from '@/shared/lib/toast';
import type { IntegrationView } from '@/contexts/integration';
import type { OrderView } from '@/contexts/order';
import { useCreatePaymentIntent } from '@/contexts/paymentIntent';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    OnlinePaymentFormSchema,
    type OnlinePaymentFormValues,
} from '../form/formData';

interface UseOnlinePaymentOptions {
    projectId: string;
    order: OrderView;
    providers: IntegrationView[];
    defaultAmount: number;
}

export function useOnlinePayment({
    projectId,
    order,
    providers,
    defaultAmount,
}: UseOnlinePaymentOptions) {
    const [confirmationUrl, setConfirmationUrl] = useState<string>();
    const { mutateAsync, isPending } = useCreatePaymentIntent(projectId);

    const form = useForm<OnlinePaymentFormValues>({
        resolver: zodResolver(OnlinePaymentFormSchema),
        defaultValues: {
            integrationId: providers[0]?.id ?? '',
            amount: defaultAmount,
        },
    });

    const returnUrl = absoluteUrl(
        ROUTES.project(projectId, 'orders', order.id),
    );

    const submit = async (values: OnlinePaymentFormValues) => {
        const { response } = await runAction(
            mutateAsync({
                projectId,
                integrationId: values.integrationId,
                orderId: order.id,
                amount: values.amount ?? 0,
                currency: order.currency,
                returnUrl,
            }),
        );

        const url = response?.data?.confirmationUrl;

        if (!url) return;

        setConfirmationUrl(url);
        toast.success('Платёжная ссылка создана');
    };

    return { form, isPending, confirmationUrl, returnUrl, submit };
}
