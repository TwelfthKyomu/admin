import {
    DESCRIPTION_LONG_MAX,
    DURATION_MINUTES_MAX,
    LABEL_MAX,
    PHONE_MAX,
} from '@/shared/constants/default';
import * as z from 'zod/mini';

export interface BookingPrefill {
    employeeId: string;
    start: Date;
    durationMinutes: number;
}

export const CreateBookingFormSchema = z.object({
    clientId: z.string(),
    serviceProductId: z.string(),
    customerName: z
        .string()
        .check(z.minLength(1, 'Укажите имя клиента'), z.maxLength(LABEL_MAX)),
    customerPhone: z.optional(z.string().check(z.maxLength(PHONE_MAX))),
    assignedEmployeeId: z.string().check(z.minLength(1, 'Выберите сотрудника')),
    scheduledDate: z.date(),
    startTime: z.string().check(z.regex(/^\d{2}:\d{2}$/, 'Укажите время')),
    durationMinutes: z.int().check(z.positive(), z.lte(DURATION_MINUTES_MAX)),
    notes: z.optional(z.string().check(z.maxLength(DESCRIPTION_LONG_MAX))),
});

export type CreateBookingFormValues = z.input<typeof CreateBookingFormSchema>;
