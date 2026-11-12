import { Input } from '@/ui/Controlled';
import { EditorCard } from './EditorCard';

export const StorefrontSection = () => (
    <EditorCard title="Сайт">
        <Input
            name="slug"
            label="URL-идентификатор"
            description="Адрес товара на сайте, подставляется из названия"
            placeholder="hoodie-logo"
            autoComplete="off"
        />
    </EditorCard>
);
