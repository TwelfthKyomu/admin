import { PaymentProvider } from '@/contexts/paymentIntent';
import type { ConnectPaymentProviderFormValues } from '../form/formData';

export function buildProviderPayload(
    values: ConnectPaymentProviderFormValues,
): Record<string, string> {
    if (values.provider === PaymentProvider.STRIPE) {
        const webhookSecret = values.webhookSecret?.trim();

        return {
            secretKey: values.secretKey.trim(),
            ...(webhookSecret ? { webhookSecret } : {}),
        };
    }

    return {
        shopId: values.shopId?.trim() ?? '',
        secretKey: values.secretKey.trim(),
    };
}
