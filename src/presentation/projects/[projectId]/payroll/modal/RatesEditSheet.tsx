'use client';

import { FormDialog } from '@/shared/components/common';
import type { PayrollRowView } from '@/contexts/payout';
import { Input, Money } from '@/ui/Controlled';
import { useRatesEditSheet } from '../hooks/useRatesEditSheet';

interface RatesSheetProps {
    projectId: string;
    row: PayrollRowView;
}

export const RatesEditSheet = ({ projectId, row }: RatesSheetProps) => {
    const { isPending, courier, form, onSubmit } = useRatesEditSheet(projectId, row);

    return (
        <FormDialog
            surface="sheet"
            title={`Ставки — ${row.employeeName}`}
            description={
                courier
                    ? 'Ставка за смену и оплата за каждую доставку. Используются в расчёте за период.'
                    : 'Ставка за смену, процент с продаж в магазине и с заказов с сайта. Используются в расчёте за период.'
            }
            form={form}
            onSubmit={onSubmit}
            submitLabel="Сохранить"
            requireValid={false}
            requireDirty={false}
            busy={isPending}
        >
            <Money
                name="shiftRateAmount"
                label="Ставка за смену"
                placeholder="0,00"
            />
            {courier ? (
                <Money
                    name="deliveryRateAmount"
                    label="За доставку"
                    placeholder="0,00"
                />
            ) : (
                <>
                    <Input
                        name="commissionRate"
                        label="Процент с продаж в магазине, %"
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0"
                    />
                    <Input
                        name="siteCommissionRate"
                        label="Процент с заказов с сайта, %"
                        description="Пусто — за заказы с сайта не начисляется."
                        type="number"
                        min={0}
                        max={100}
                        placeholder="Не начисляется"
                    />
                </>
            )}
        </FormDialog>
    );
};
