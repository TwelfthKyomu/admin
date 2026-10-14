'use client';

import type { Option } from '@/shared/types';
import { FieldGroup } from '@/ui/Base';
import { Combobox, DatePicker, Input, Select, Textarea, TimePicker } from '@/ui/Controlled';

interface BookingFormProps {
    employeeOptions: Option[];
    clientOptions: Option[];
    serviceOptions: Option[];
    onClientChange: (clientId: string) => void;
    onServiceChange: (serviceId: string) => void;
}

export const BookingForm = ({
    employeeOptions,
    clientOptions,
    serviceOptions,
    onClientChange,
    onServiceChange,
}: BookingFormProps) => (
    <FieldGroup>
        <Combobox
            name="clientId"
            label="Клиент"
            options={clientOptions}
            searchPlaceholder="Имя, email или телефон…"
            onValueChange={onClientChange}
        />
        <Select
            name="serviceProductId"
            label="Услуга"
            options={serviceOptions}
            onValueChange={onServiceChange}
        />
        <Input
            name="customerName"
            label="Имя клиента"
            placeholder="Иван Петров"
        />
        <Input
            name="customerPhone"
            label="Телефон"
            placeholder="+7 900 000-00-00"
        />
        <Select
            name="assignedEmployeeId"
            label="Сотрудник"
            options={employeeOptions}
        />
        <div className="grid grid-cols-2 gap-3">
            <DatePicker
                name="scheduledDate"
                label="Дата"
            />
            <TimePicker
                name="startTime"
                label="Начало"
            />
        </div>
        <Input
            name="durationMinutes"
            label="Длительность, мин"
            type="number"
            min="5"
            step="5"
        />
        <Textarea
            name="notes"
            label="Заметка"
            placeholder="Необязательно"
        />
    </FieldGroup>
);
