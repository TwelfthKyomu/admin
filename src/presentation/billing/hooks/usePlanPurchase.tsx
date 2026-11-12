'use client';

import { runAction } from '@/shared/lib/action-result';
import { modal } from '@/shared/lib/modal';
import { toast } from '@/shared/lib/toast';
import {
    type BillingPeriod,
    PLAN_CATALOG,
    type SubscriptionPlan,
    usePurchasePlan,
} from '@/contexts/subscription';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

const StripeCheckoutModal = dynamic(() =>
    import('../modal/StripeCheckoutModal').then((m) => m.StripeCheckoutModal),
);

const TestCheckoutModal = dynamic(() =>
    import('../modal/TestCheckoutModal').then((m) => m.TestCheckoutModal),
);

export const usePlanPurchase = (plan: SubscriptionPlan, period: BillingPeriod) => {
    const { refresh } = useRouter();
    const { mutateAsync, isPending } = usePurchasePlan();

    const select = async () => {
        const { success, response } = await runAction(mutateAsync({ plan, period }), {});
        const result = response?.data;

        if (!success || !result) return;

        if (result.mode === 'redirect') {
            window.location.assign(result.url);

            return;
        }

        if (result.mode === 'embedded') {
            modal.open(
                <StripeCheckoutModal
                    plan={plan}
                    period={period}
                    sessionId={result.sessionId}
                    clientSecret={result.clientSecret}
                />,
            );

            return;
        }

        if (result.mode === 'test') {
            modal.open(
                <TestCheckoutModal
                    plan={plan}
                    period={period}
                    sessionId={result.sessionId}
                />,
            );

            return;
        }

        toast.success(`Тариф изменён на ${PLAN_CATALOG[plan].label}`);
        refresh();
    };

    return { select, isPending };
};
