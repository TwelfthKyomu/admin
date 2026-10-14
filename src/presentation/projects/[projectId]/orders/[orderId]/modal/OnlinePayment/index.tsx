'use client';

import { FormDialog } from '@/shared/components/common';
import { CURRENCY_SYMBOL } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import type { IntegrationView } from '@/contexts/integration';
import type { OrderView } from '@/contexts/order';
import { Money, Select } from '@/ui/Controlled';
import type { OnlinePaymentFormValues } from '../../form/formData';
import { useOnlinePayment } from '../../hooks/useOnlinePayment';
import { LinkReady } from './LinkReady';
import { NoProviders } from './NoProviders';

interface OnlinePaymentModalProps {
    projectId: string;
    order: OrderView;
    providers: IntegrationView[];
    defaultAmount: number;
}

export const OnlinePaymentModal = ({
    projectId,
    order,
    providers,
    defaultAmount,
}: OnlinePaymentModalProps) => {
    const { form, isPending, confirmationUrl, returnUrl, submit } = useOnlinePayment({
        projectId,
        order,
        providers,
        defaultAmount,
    });

    if (confirmationUrl) return <LinkReady url={confirmationUrl} />;

    if (providers.length === 0) return <NoProviders />;

    return (
        <FormDialog
            title="Онлайн-оплата"
            description="Создаст счёт у провайдера и вернёт ссылку. Отправь её клиенту в любом мессенджере."
            className="max-w-md"
            bodyClassName="grid gap-3"
            form={form}
            onSubmit={submit}
            submitLabel="Создать ссылку"
            requireDirty={false}
            busy={isPending}
        >
            <Select<OnlinePaymentFormValues, 'integrationId', string>
                name="integrationId"
                label="Провайдер"
                options={providers.map((provider) => ({
                    value: provider.id,
                    label: provider.name,
                }))}
            />
            <Money<OnlinePaymentFormValues>
                name="amount"
                label={`Сумма, ${CURRENCY_SYMBOL[order.currency]}`}
                description={`По умолчанию: ${fmtMoney(defaultAmount, order.currency)}`}
            />
            <p className="text-[11px] text-muted-foreground">
                После оплаты клиент будет возвращён на: <br />
                <code className="break-all">{returnUrl}</code>
            </p>
        </FormDialog>
    );
};
