'use client';

import { useModalClose } from '@/shared/lib/modal';
import type { BillingPeriod, SubscriptionPlan } from '@/contexts/subscription';
import { Modal } from '@/ui/Base';
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from '@stripe/react-stripe-js';
import { useStripeCheckout } from '../hooks/useStripeCheckout';
import { checkoutTitle } from '../lib/checkoutTitle';
import { stripePromise } from '../lib/stripe';

interface StripeCheckoutModalProps {
    plan: SubscriptionPlan;
    period: BillingPeriod;
    sessionId: string;
    clientSecret: string;
}

export const StripeCheckoutModal = ({
    plan,
    period,
    sessionId,
    clientSecret,
}: StripeCheckoutModalProps) => {
    const close = useModalClose();
    const { onComplete } = useStripeCheckout(sessionId);

    return (
        <Modal
            onClose={close}
            title={checkoutTitle(plan, period)}
            description="Оплата картой через Stripe. Тариф включится сразу после оплаты."
            className="sm:max-w-xl"
        >
            <div className="-mx-6 max-h-[70vh] overflow-y-auto">
                <EmbeddedCheckoutProvider
                    stripe={stripePromise}
                    options={{ clientSecret, onComplete }}
                >
                    <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
            </div>
        </Modal>
    );
};
