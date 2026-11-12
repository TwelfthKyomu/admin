'use client';

import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { useCompleteTestBillingPayment } from '@/contexts/subscription';

export const useTestCheckout = (sessionId: string) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCompleteTestBillingPayment();

    const complete = async (paid: boolean) => {
        const { success } = await runAction(mutateAsync({ sessionId, paid }), {
            success: paid ? 'Тариф оплачен и включён' : 'Оплата отменена',
        });

        if (success) close();
    };

    return {
        isPending,
        onPay: () => complete(true),
        onCancel: () => complete(false),
    };
};
