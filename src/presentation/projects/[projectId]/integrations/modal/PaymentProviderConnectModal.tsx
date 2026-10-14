'use client';

import { useForm, useWatch } from 'react-hook-form';
import {
    PAYMENT_PROVIDER_AVAILABLE,
    PAYMENT_PROVIDER_LABEL,
    PAYMENT_PROVIDER_OPTIONS,
} from '@/shared/labels/payment';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { PaymentProvider, useConnectPaymentProvider } from '@/contexts/paymentIntent';
import { Button, Modal } from '@/ui/Base';
import { Form, Input, Select } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    CONNECT_PROVIDER_DEFAULT,
    ConnectPaymentProviderFormSchema,
    type ConnectPaymentProviderFormValues,
} from '../form/formData';
import { buildProviderPayload } from '../lib/providerPayload';

export const PaymentProviderConnectModal = ({ projectId }: { projectId: string }) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useConnectPaymentProvider(projectId);

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

    return (
        <Modal
            onClose={close}
            busy={isPending}
            title="Подключить платёжного провайдера"
            description="После сохранения скопируйте URL уведомлений из таблицы и пропишите его в личном кабинете провайдера."
            className="max-w-md"
        >
            <Form
                form={form}
                onSubmit={onSubmit}
                className="grid gap-3"
            >
                <Input<ConnectPaymentProviderFormValues>
                    name="name"
                    label="Название"
                    placeholder="Например: Stripe магазин"
                    autoFocus
                />
                <Select<ConnectPaymentProviderFormValues, 'provider', PaymentProvider>
                    name="provider"
                    label="Провайдер"
                    options={PAYMENT_PROVIDER_OPTIONS}
                    onValueChange={onProviderChange}
                />

                {provider === PaymentProvider.STRIPE && (
                    <>
                        <Input<ConnectPaymentProviderFormValues>
                            name="secretKey"
                            label="Secret key"
                            type="password"
                            placeholder="sk_live_… или sk_test_…"
                            description="Stripe Dashboard → Developers → API keys."
                        />
                        <Input<ConnectPaymentProviderFormValues>
                            name="webhookSecret"
                            label="Webhook signing secret (необязательно)"
                            type="password"
                            placeholder="whsec_…"
                            description="Появится после создания webhook-эндпоинта в Stripe на URL уведомлений. Без него события проверяются запросом к Stripe API — можно добавить позже."
                        />
                    </>
                )}

                {provider === PaymentProvider.YOOKASSA && (
                    <>
                        <Input<ConnectPaymentProviderFormValues>
                            name="shopId"
                            label="Shop ID"
                            placeholder="123456"
                            description="Найти можно в личном кабинете ЮKassa → Настройки магазина."
                        />
                        <Input<ConnectPaymentProviderFormValues>
                            name="secretKey"
                            label="Секретный ключ"
                            type="password"
                            placeholder="live_xxxxxxx"
                        />
                    </>
                )}

                {!PAYMENT_PROVIDER_AVAILABLE[provider] && (
                    <p className="text-[12px] text-muted-foreground">
                        Этот провайдер ещё не реализован. Используй Stripe.
                    </p>
                )}

                <Modal.Footer>
                    <Button
                        type="submit"
                        disabled={isPending || !PAYMENT_PROVIDER_AVAILABLE[provider]}
                    >
                        Подключить
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={isPending}
                        onClick={close}
                    >
                        Отмена
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};
