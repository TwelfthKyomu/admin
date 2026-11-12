'use client';

import { useForm } from 'react-hook-form';
import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    type CourierBalanceView,
    useAcceptCourierCash,
} from '@/contexts/cashShift';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    AcceptCourierCashFormSchema,
    type AcceptCourierCashFormValues,
} from '../form/formData';

export const useCourierCashAcceptSheet = ({
    projectId,
    courier,
    currency,
}: {
    projectId: string;
    courier: CourierBalanceView;
    currency: Currency;
}) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useAcceptCourierCash();

    const form = useForm<AcceptCourierCashFormValues>({
        resolver: zodResolver(AcceptCourierCashFormSchema),
        defaultValues: { amount: courier.onHand },
    });

    const submit = async (values: AcceptCourierCashFormValues) => {
        const amount = values.amount ?? 0;

        if (amount <= 0 || amount > courier.onHand) {
            form.setError('amount', {
                message: `От 0,01 до ${fmtMoney(courier.onHand, currency)}`,
            });

            return;
        }

        const { success } = await runAction(
            mutateAsync({ projectId, employeeId: courier.employeeId, amount }),
            { success: `Приняли ${fmtMoney(amount, currency)} у курьера` },
        );

        if (success) close();
    };

    return { isPending, form, submit };
};
