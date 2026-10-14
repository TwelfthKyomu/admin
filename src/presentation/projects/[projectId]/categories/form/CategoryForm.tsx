import { PROJECT_CATEGORY_TYPE_OPTIONS } from '@/shared/labels/catalog';
import type { Option } from '@/shared/types';
import { FieldGroup } from '@/ui/Base';
import { Input, Select } from '@/ui/Controlled';

export const CategoryForm = ({ parentOptions }: { parentOptions?: Option[] }) => (
    <FieldGroup>
        <Input
            name="name"
            label="Название"
            placeholder="Например: Куртки"
            autoFocus
        />
        {parentOptions && (
            <Select
                name="parentId"
                label="Родительская категория"
                options={parentOptions}
            />
        )}
        <Select
            name="type"
            label="Тип"
            options={PROJECT_CATEGORY_TYPE_OPTIONS}
        />
    </FieldGroup>
);
