'use client';

import { useEffect } from 'react';
import { ROUTES } from '@/shared/constants';
import { runAction } from '@/shared/lib/action-result';
import { useSyncBillingPayment } from '@/contexts/subscription';
import { useRouter, useSearchParams } from 'next/navigation';

export const useCheckoutReturn = () => {
    const sessionId = useSearchParams().get('session_id');
    const { replace } = useRouter();
    const { mutateAsync } = useSyncBillingPayment();

    useEffect(() => {
        if (!sessionId) return;

        void runAction(mutateAsync({ sessionId }), {}).then(() =>
            replace(ROUTES.billing),
        );
    }, [sessionId]);
};
