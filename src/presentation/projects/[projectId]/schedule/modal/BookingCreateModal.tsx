'use client';

import { FormDialog } from '@/shared/components/common';
import type { Option } from '@/shared/types';
import { BookingForm } from '../form/BookingForm';
import type { BookingPrefill } from '../form/formData';
import { useCreateBooking } from '../hooks/useCreateBooking';

interface CreateBookingModalProps {
    projectId: string;
    employeeOptions: Option[];
    prefill: BookingPrefill;
}

export const BookingCreateModal = ({
    projectId,
    employeeOptions,
    prefill,
}: CreateBookingModalProps) => {
    const {
        form,
        isPending,
        clientOptions,
        serviceOptions,
        onClientChange,
        onServiceChange,
        submit,
    } = useCreateBooking(projectId, prefill);

    return (
        <FormDialog
            title="Новая запись"
            description="Создание записи клиента в выбранное окно. Сотрудник и время подставлены из календаря."
            form={form}
            onSubmit={submit}
            submitLabel="Создать запись"
            requireDirty={false}
            busy={isPending}
        >
            <BookingForm
                employeeOptions={employeeOptions}
                clientOptions={clientOptions}
                serviceOptions={serviceOptions}
                onClientChange={onClientChange}
                onServiceChange={onServiceChange}
            />
        </FormDialog>
    );
};
