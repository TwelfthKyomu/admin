'use client';

import { useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { type CourierBalanceView, useAcceptCourierCash } from '@/contexts/cashShift';
import { Money } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import { AcceptCourierCashFormSchema, type AcceptCourierCashFormValues } from '../form/formData';

interface AcceptCourierCashSheetProps {
    projectId: string;
    courier: CourierBalanceView;
    currency: Currency;
}

export const CourierCashAcceptSheet = ({
    projectId,
    courier,
    currency,
}: AcceptCourierCashSheetProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useAcceptCourierCash(projectId);

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

    return (
        <FormDialog
            surface="sheet"
            title={`Принять у курьера: ${courier.name}`}
            description={`На руках ${fmtMoney(courier.onHand, currency)}. Деньги попадут в открытую кассовую смену.`}
            form={form}
            onSubmit={submit}
            submitLabel="Принять"
            requireValid={false}
            requireDirty={false}
            busy={isPending}
        >
            <Money<AcceptCourierCashFormValues>
                name="amount"
                label="Сумма"
                autoFocus
            />
        </FormDialog>
    );
};
