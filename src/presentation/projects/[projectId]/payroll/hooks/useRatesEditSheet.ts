'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    EmployeeKind,
    useUpdateAssignmentRates,
} from '@/contexts/employeeAssignment';
import type { PayrollRowView } from '@/contexts/payout';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    UpdateRatesFormSchema,
    type UpdateRatesFormValues,
} from '../form/formData';

export const useRatesEditSheet = (projectId: string, row: PayrollRowView) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateAssignmentRates();
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
                commissionRate: courier
                    ? undefined
                    : (values.commissionRate ?? 0),
                siteCommissionRate: courier
                    ? undefined
                    : (values.siteCommissionRate ?? null),
                deliveryRateAmount: courier
                    ? (values.deliveryRateAmount ?? 0)
                    : undefined,
            }),
            { success: 'Ставки обновлены' },
        );

        if (success) close();
    };

    return { isPending, courier, form, onSubmit };
};
