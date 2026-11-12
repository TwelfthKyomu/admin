import 'server-only';

import type { WebhookOutcome } from '@/infrastructure/payments/provider';
import { ApplicationError } from '@/shared/api/errors';
import { PaymentIntentStatus } from '@/contexts/paymentIntent/PaymentIntent.types';
import { findBillingPayment, settleBillingPayment } from './BillingSettle.lib';
import { billingProvider } from './Subscription.lib';
import {
    type BillingCheckout,
    BillingProvider,
    TEST_BILLING_SESSION_PREFIX,
} from './Subscription.types';

export const createTestCheckout = async (): Promise<BillingCheckout> => {
    return {
        mode: 'test',
        sessionId: `${TEST_BILLING_SESSION_PREFIX}${crypto.randomUUID()}`,
    };
};

export const completeTestBillingPayment = async (
    organizationId: string,
    sessionId: string,
    paid: boolean,
): Promise<WebhookOutcome> => {
    if (billingProvider() !== BillingProvider.TEST) {
        throw new ApplicationError('Тестовая оплата выключена');
    }

    const payment = await findBillingPayment(organizationId, sessionId);

    return settleBillingPayment({
        providerPaymentId: payment.providerSessionId,
        status: paid
            ? PaymentIntentStatus.SUCCEEDED
            : PaymentIntentStatus.CANCELLED,
        amount: payment.amount,
    });
};
