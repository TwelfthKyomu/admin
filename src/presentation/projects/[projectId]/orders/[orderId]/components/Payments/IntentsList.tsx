'use client';

import { fmtDateFull } from '@/shared/format/date';
import { fmtMoney } from '@/shared/format/money';
import {
    PAYMENT_INTENT_STATUS_LABEL,
    PAYMENT_INTENT_STATUS_VARIANT,
    PAYMENT_PROVIDER_LABEL,
} from '@/shared/labels/payment';
import { confirmDestructive } from '@/shared/lib/modal';
import {
    PaymentIntentStatus,
    type PaymentIntentView,
    useRefundUnappliedIntent,
} from '@/contexts/paymentIntent';
import { Badge, Button } from '@/ui/Base';
import { ExternalLink } from 'lucide-react';

interface PaymentIntentsListProps {
    projectId: string;
    intents: PaymentIntentView[];
    canManage: boolean;
}

export const PaymentIntentsList = ({ projectId, intents, canManage }: PaymentIntentsListProps) => {
    const refund = useRefundUnappliedIntent(projectId);

    const onRefund = (intent: PaymentIntentView) =>
        confirmDestructive({
            title: 'Вернуть деньги клиенту?',
            description: `Провайдер вернёт ${fmtMoney(intent.amount, intent.currency)} на карту клиента. На заказ эта оплата не зачислялась.`,
            confirmLabel: 'Вернуть',
            success: 'Возврат отправлен провайдеру',
            onConfirm: () => refund.mutateAsync({ id: intent.id, projectId }),
        });

    return (
        <div className="border-t border-border">
            <div className="px-4 h-8 flex items-center text-[10px] uppercase tracking-wider text-muted-foreground">
                Онлайн-платежи
            </div>
            <ul className="divide-y divide-border">
                {intents.map((intent) => (
                    <li
                        key={intent.id}
                        className="px-4 py-2.5 grid gap-1 text-[12px]"
                    >
                        <div className="flex items-center gap-3">
                            <Badge variant={PAYMENT_INTENT_STATUS_VARIANT[intent.status]}>
                                {PAYMENT_INTENT_STATUS_LABEL[intent.status]}
                            </Badge>
                            <span className="text-muted-foreground tabular-nums">
                                {fmtDateFull(intent.createdAt)}
                            </span>
                            <span className="text-muted-foreground">
                                {PAYMENT_PROVIDER_LABEL[intent.provider]}
                            </span>
                            <span className="ml-auto font-medium tabular-nums">
                                {fmtMoney(intent.amount, intent.currency)}
                            </span>
                            {intent.confirmationUrl &&
                                intent.status === PaymentIntentStatus.PENDING && (
                                    <a
                                        href={intent.confirmationUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-muted-foreground hover:text-foreground"
                                        aria-label="Открыть платёжную ссылку"
                                    >
                                        <ExternalLink className="size-4" />
                                    </a>
                                )}
                        </div>
                        {intent.applyError &&
                            (intent.refundedAt ? (
                                <p className="text-muted-foreground">
                                    Не зачислен на заказ ({intent.applyError}) и возвращён клиенту{' '}
                                    {fmtDateFull(intent.refundedAt)}.
                                </p>
                            ) : (
                                <div className="flex items-start gap-2">
                                    <p className="text-destructive">
                                        Деньги получены, но не зачислены на заказ:{' '}
                                        {intent.applyError}. Проведите оплату вручную или верните
                                        деньги клиенту.
                                    </p>
                                    {canManage && (
                                        <Button
                                            size="xs"
                                            variant="outline"
                                            disabled={refund.isPending}
                                            onClick={() => onRefund(intent)}
                                        >
                                            Вернуть
                                        </Button>
                                    )}
                                </div>
                            ))}
                    </li>
                ))}
            </ul>
        </div>
    );
};
