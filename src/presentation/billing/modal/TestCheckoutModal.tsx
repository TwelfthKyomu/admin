'use client';

import { DetailRow } from '@/shared/components/common';
import { DEFAULT_CURRENCY } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import { useModalClose } from '@/shared/lib/modal';
import {
    BILLING_PERIOD_LABEL,
    type BillingPeriod,
    PLAN_CATALOG,
    type SubscriptionPlan,
} from '@/contexts/subscription';
import { Button, Modal } from '@/ui/Base';
import { useTestCheckout } from '../hooks/useTestCheckout';
import { checkoutTitle } from '../lib/checkoutTitle';

interface TestCheckoutModalProps {
    plan: SubscriptionPlan;
    period: BillingPeriod;
    sessionId: string;
}

export const TestCheckoutModal = ({ plan, period, sessionId }: TestCheckoutModalProps) => {
    const close = useModalClose();
    const { isPending, onPay, onCancel } = useTestCheckout(sessionId);
    const amount = fmtMoney(PLAN_CATALOG[plan].price[period], DEFAULT_CURRENCY);

    return (
        <Modal
            onClose={close}
            busy={isPending}
            title={checkoutTitle(plan, period)}
            description="Тестовый режим: деньги не списываются, тариф включится сразу."
            className="sm:max-w-sm"
        >
            <div className="flex flex-col gap-2 text-[13px]">
                <DetailRow
                    label="Тариф"
                    value={PLAN_CATALOG[plan].label}
                />
                <DetailRow
                    label="Срок"
                    value={BILLING_PERIOD_LABEL[period]}
                />
                <DetailRow
                    label="К оплате"
                    value={amount}
                    strong
                />
            </div>
            <Modal.Footer>
                <Button
                    disabled={isPending}
                    onClick={onPay}
                >
                    Оплатить {amount}
                </Button>
                <Button
                    variant="outline"
                    disabled={isPending}
                    onClick={onCancel}
                >
                    Отмена
                </Button>
            </Modal.Footer>
        </Modal>
    );
};
