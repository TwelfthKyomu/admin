'use client';

import { FormDialog } from '@/shared/components/common';
import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import type { CourierBalanceView } from '@/contexts/cashShift';
import { Money } from '@/ui/Controlled';
import type { AcceptCourierCashFormValues } from '../form/formData';
import { useCourierCashAcceptSheet } from '../hooks/useCourierCashAcceptSheet';

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
    const { isPending, form, submit } = useCourierCashAcceptSheet({ projectId, courier, currency });

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
