import type {
    PaymentIntentStatus,
    PaymentProvider,
} from '@/contexts/paymentIntent/PaymentIntent.types';

export type WebhookOutcome = 'applied' | 'cancelled' | 'ignored';

export interface PaymentProviderCredentials {
    integrationId: string;
    provider: PaymentProvider;
    payload: Record<string, unknown>;
}

export interface CreatePaymentInput {
    intent: {
        id: string;
        amount: number;
        currency: string;
        idempotenceKey?: string;
    };
    returnUrl: string;
    description?: string;
    expiresAt?: Date;
}

export interface CreatePaymentOutput {
    providerPaymentId: string;
    confirmationUrl: string | null;
    metadata?: Record<string, unknown>;
}

export interface PaymentWebhookEvent {
    providerPaymentId: string;
    status: PaymentIntentStatus;
    amount?: number;
    currency?: string;
    raw?: Record<string, unknown>;
}

export interface RefundInput {
    intent: {
        id: string;
        amount: number;
        currency: string;
        providerPaymentId: string | null;
        metadata: Record<string, unknown>;
    };
    amount: number;
    reason?: string;
    idempotenceKey?: string;
}

export interface RefundOutput {
    providerRefundId: string;
    raw?: Record<string, unknown>;
}
