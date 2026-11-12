import { PRODUCT_STATUS_OPTIONS } from '@/shared/labels/catalog';
import { Checkbox, Select } from '@/ui/Controlled';
import { EditorCard } from './EditorCard';

export const StatusSection = () => (
    <EditorCard title="Статус">
        <Select
            name="status"
            options={PRODUCT_STATUS_OPTIONS}
            description="«По ссылке» — товара нет в каталоге и поиске сайта, но его можно открыть и купить по прямой ссылке"
        />
        <Checkbox
            name="isFeatured"
            label="Рекомендуемый товар"
        />
    </EditorCard>
);
