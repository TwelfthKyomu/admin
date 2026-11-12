'use client';

import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { toast } from '@/shared/lib/toast';
import { useSyncBillingPayment } from '@/contexts/subscription';

export const useStripeCheckout = (sessionId: string) => {
    const close = useModalClose();
    const { mutateAsync } = useSyncBillingPayment();

    const onComplete = async () => {
        const { success, response } = await runAction(
            mutateAsync({ sessionId }),
            {},
        );

        if (!success) return;

        toast.success(
            response?.data?.outcome === 'applied'
                ? 'Тариф оплачен и включён'
                : 'Оплата получена, тариф включится после подтверждения Stripe',
        );

        close();
    };

    return { onComplete };
};
