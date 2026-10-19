'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { EmployeeKind, useUpdateAssignmentRates } from '@/contexts/employeeAssignment';
import type { PayrollRowView } from '@/contexts/payout';
import { Input, Money } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import { UpdateRatesFormSchema, type UpdateRatesFormValues } from '../form/formData';

interface RatesSheetProps {
    projectId: string;
    row: PayrollRowView;
}

export const RatesEditSheet = ({ projectId, row }: RatesSheetProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateAssignmentRates(projectId);
    const courier = row.kind === EmployeeKind.COURIER;

    const form = useForm<UpdateRatesFormValues>({
        values: {
            shiftRateAmount: row.shiftRateAmount,
            commissionRate: row.commissionRate,
            siteCommissionRate: row.siteCommissionRate || undefined,
            deliveryRateAmount: row.deliveryRateAmount,
        },
        resolver: zodResolver(UpdateRatesFormSchema),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<UpdateRatesFormValues> = async (values) => {
        const { success } = await runAction(
            mutateAsync({
                id: row.assignmentId,
                projectId,
                shiftRateAmount: values.shiftRateAmount ?? 0,
                commissionRate: courier ? undefined : (values.commissionRate ?? 0),
                siteCommissionRate: courier ? undefined : (values.siteCommissionRate ?? null),
                deliveryRateAmount: courier ? (values.deliveryRateAmount ?? 0) : undefined,
            }),
            { success: 'Ставки обновлены' },
        );

        if (success) close();
    };

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
