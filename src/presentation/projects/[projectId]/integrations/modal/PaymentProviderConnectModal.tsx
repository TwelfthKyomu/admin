'use client';

import { PAYMENT_PROVIDER_AVAILABLE, PAYMENT_PROVIDER_OPTIONS } from '@/shared/labels/payment';
import { PaymentProvider } from '@/contexts/paymentIntent';
import { Button, Modal } from '@/ui/Base';
import { Form, Input, Select } from '@/ui/Controlled';
import type { ConnectPaymentProviderFormValues } from '../form/formData';
import { usePaymentProviderConnectModal } from '../hooks/usePaymentProviderConnectModal';

export const PaymentProviderConnectModal = ({ projectId }: { projectId: string }) => {
    const { close, isPending, form, provider, onProviderChange, onSubmit } =
        usePaymentProviderConnectModal(projectId);

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
