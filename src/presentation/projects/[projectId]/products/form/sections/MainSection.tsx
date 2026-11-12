import { Input, Textarea } from '@/ui/Controlled';
import { EditorCard } from './EditorCard';

export const MainSection = () => (
    <EditorCard title="Основное">
        <Input
            name="name"
            label="Название"
            placeholder="Худи Logo"
        />
        <Textarea
            name="description"
            label="Описание"
            placeholder="Что это, из чего, для кого"
            rows={5}
        />
    </EditorCard>
);
