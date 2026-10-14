import { FieldGroup } from '@/ui/Base';
import { ColorPicker, Input } from '@/ui/Controlled';

export const BadgeForm = ({ disableCode = false }: { disableCode?: boolean }) => (
    <FieldGroup>
        <Input
            name="label"
            label="Название"
            placeholder="Лимитированная версия"
        />
        {!disableCode && (
            <Input
                name="code"
                label="Код"
                placeholder="limited-edition"
            />
        )}
        <ColorPicker
            name="color"
            label="Цвет"
        />
    </FieldGroup>
);
