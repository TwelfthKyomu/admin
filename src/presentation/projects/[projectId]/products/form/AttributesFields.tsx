import type { Option } from '@/shared/types';
import { ProductType } from '@/contexts/product';
import { Checkbox, Input, MultiSelect } from '@/ui/Controlled';
import { EditionFields } from './EditionFields';

interface AttributesFieldsProps {
    type: ProductType;
    performerOptions: Option[];
}

export const AttributesFields = ({ type, performerOptions }: AttributesFieldsProps) => (
    <div className="grid gap-4 sm:grid-cols-2">
        {type === ProductType.PHYSICAL && (
            <>
                <Input
                    name="attributes.weightGrams"
                    label="Вес, г"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Не указан"
                />
                <EditionFields />
            </>
        )}

        {type === ProductType.SERVICE && (
            <>
                <Input
                    name="attributes.durationMinutes"
                    label="Длительность, мин"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="60"
                />
                <Input
                    name="attributes.bufferMinutes"
                    label="Буфер между записями, мин"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="0"
                />
                <Checkbox
                    name="attributes.bookable"
                    label="Доступна для записи"
                />
                <MultiSelect
                    name="performerIds"
                    label="Кто оказывает услугу"
                    description="Пусто — любой сотрудник проекта."
                    options={performerOptions}
                    emptyText="В проекте нет сотрудников"
                />
            </>
        )}
    </div>
);
