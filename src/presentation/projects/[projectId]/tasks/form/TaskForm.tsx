import type { Option } from '@/shared/types';
import { FieldGroup } from '@/ui/Base';
import { DatePicker, Input, Select, Textarea } from '@/ui/Controlled';
import { TASK_PRIORITY_OPTIONS, TASK_STATUS_OPTIONS } from '../lib/taskOptions';
import { SubtasksField } from './SubtasksField';

export const TaskForm = ({ assigneeOptions }: { assigneeOptions: Option[] }) => (
    <FieldGroup>
        <Input
            name="title"
            label="Название"
            placeholder="Что нужно сделать"
            autoFocus
        />
        <div className="grid gap-3 sm:grid-cols-2">
            <Select
                name="status"
                label="Статус"
                options={TASK_STATUS_OPTIONS}
            />
            <Select
                name="priority"
                label="Приоритет"
                options={TASK_PRIORITY_OPTIONS}
            />
            <Select
                name="assigneeUserId"
                label="Исполнитель"
                options={assigneeOptions}
            />
            <DatePicker
                name="dueAt"
                label="Срок"
            />
        </div>
        <Textarea
            name="description"
            label="Описание"
            placeholder="Детали, ссылки, критерии приёмки…"
            rows={4}
        />
        <SubtasksField />
    </FieldGroup>
);
