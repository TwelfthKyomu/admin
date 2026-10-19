import { Input } from '@/ui/Controlled';
import { EditionFields } from './EditionFields';

export const AttributesFields = () => (
    <div className="grid gap-4 sm:grid-cols-2">
        <Input
            name="attributes.weightGrams"
            label="Вес, г"
            type="number"
            min="0"
            step="1"
            placeholder="Не указан"
        />
        <EditionFields />
    </div>
);
