'use client';

import { fmtMoney } from '@/shared/format/money';
import { modal } from '@/shared/lib/modal';
import { IntegrationType, useIntegrationsList } from '@/contexts/integration';
import type { OrderView } from '@/contexts/order';
import { usePaymentIntentsList } from '@/contexts/paymentIntent';
import { Button } from '@/ui/Base';
import { OnlinePaymentModal } from '../../modal/OnlinePayment';
import { PaymentModal } from '../../modal/PaymentModal';
import { DetailRow } from '../DetailRow';
import { Section } from '../Section';
import { PaymentIntentsList } from './IntentsList';

interface PaymentsSectionProps {
    order: OrderView;
    projectId: string;
    canManage: boolean;
}

export const PaymentsSection = ({ order, projectId, canManage }: PaymentsSectionProps) => {
    const integrations = useIntegrationsList(projectId).data ?? [];
    const intents = usePaymentIntentsList({ projectId, orderId: order.id }).data ?? [];

    const providers = integrations.filter(
        (integration) =>
            integration.type === IntegrationType.PAYMENT_PROVIDER && integration.isActive,
    );

    const net = order.paidAmount - order.refundedAmount;
    const dueTotal = order.totalAmount;
    const remainingToPay = Math.max(0, dueTotal - net);
    const refundable = Math.max(0, net);

    return (
        <Section
            title="Платежи"
            aside={
                <span className="text-[11px] tabular-nums text-muted-foreground">
                    {fmtMoney(net, order.currency)} / {fmtMoney(dueTotal, order.currency)}
                </span>
            }
        >
            <div className="grid gap-1.5 px-4 py-3 text-[13px]">
                <DetailRow
                    label="Получено"
                    value={fmtMoney(order.paidAmount, order.currency)}
                />
                {order.refundedAmount > 0 && (
                    <DetailRow
                        label="Возвращено"
                        value={`−${fmtMoney(order.refundedAmount, order.currency)}`}
                        dim
                    />
                )}
                <DetailRow
                    label="К оплате"
                    value={fmtMoney(remainingToPay, order.currency)}
                    strong={remainingToPay > 0}
                    dim={remainingToPay === 0}
                />
            </div>

            {canManage && (
                <footer className="flex flex-wrap gap-2 border-t border-border px-4 py-3">
                    <Button
                        size="sm"
                        disabled={remainingToPay === 0}
                        onClick={() =>
                            modal.open(
                                <PaymentModal
                                    projectId={projectId}
                                    order={order}
                                    mode="payment"
                                    maxAmount={remainingToPay}
                                />,
                            )
                        }
                    >
                        Записать платёж
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={remainingToPay === 0}
                        onClick={() =>
                            modal.open(
                                <OnlinePaymentModal
                                    projectId={projectId}
                                    order={order}
                                    providers={providers}
                                    defaultAmount={remainingToPay}
                                />,
                            )
                        }
                    >
                        Онлайн-оплата
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={refundable === 0}
                        onClick={() =>
                            modal.open(
                                <PaymentModal
                                    projectId={projectId}
                                    order={order}
                                    mode="refund"
                                    maxAmount={refundable}
                                />,
                            )
                        }
                    >
                        Возврат
                    </Button>
                </footer>
            )}

            {intents.length > 0 && (
                <PaymentIntentsList
                    projectId={projectId}
                    intents={intents}
                    canManage={canManage}
                />
            )}
        </Section>
    );
};
