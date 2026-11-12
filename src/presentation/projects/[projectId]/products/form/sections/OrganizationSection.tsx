import { PRODUCT_TYPE_OPTIONS } from '@/shared/labels/catalog';
import type { Option } from '@/shared/types';
import type { ProductType } from '@/contexts/product';
import { MultiSelect, Select } from '@/ui/Controlled';
import { EditorCard } from './EditorCard';

interface OrganizationSectionProps {
    categoryOptions: Option[];
    badgeOptions: Option[];
    onTypeChange: (type: ProductType) => void;
}

export const OrganizationSection = ({
    categoryOptions,
    badgeOptions,
    onTypeChange,
}: OrganizationSectionProps) => (
    <EditorCard title="Каталог">
        <Select
            name="type"
            label="Тип"
            options={PRODUCT_TYPE_OPTIONS}
            onValueChange={onTypeChange}
        />
        <Select
            name="categoryId"
            label="Категория"
            options={categoryOptions}
        />
        <MultiSelect
            name="badges"
            label="Бейджи"
            options={badgeOptions}
            emptyText="В проекте пока нет бейджей"
        />
    </EditorCard>
);
