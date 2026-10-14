import { UpdateAssignmentRatesActionInputSchema } from '@/contexts/employeeAssignment';
import * as z from 'zod/mini';

export const UpdateRatesFormSchema = z.pick(
    UpdateAssignmentRatesActionInputSchema,
    {
        shiftRateAmount: true,
        commissionRate: true,
        deliveryRateAmount: true,
    },
);

export type UpdateRatesFormValues = z.input<typeof UpdateRatesFormSchema>;
