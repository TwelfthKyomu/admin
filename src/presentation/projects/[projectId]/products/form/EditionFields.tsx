import { Checkbox, Field, FieldContent, FieldDescription, FieldLabel } from '@/ui/Base';
import { Input } from '@/ui/Controlled';
import { useEditionField } from '../hooks/useEditionField';

const LIMITED_ID = 'attributes-limited';

export const EditionFields = () => {
    const { isLimited, onLimitedChange } = useEditionField();

    return (
        <>
            <Field
                orientation="horizontal"
                className="gap-2 sm:col-span-2"
            >
                <Checkbox
                    id={LIMITED_ID}
                    checked={isLimited}
                    onCheckedChange={onLimitedChange}
                />
                <FieldContent>
                    <FieldLabel htmlFor={LIMITED_ID}>Лимитированный тираж</FieldLabel>
                    <FieldDescription>
                        Продано считается по заказам, витрина покажет, сколько осталось.
                    </FieldDescription>
                </FieldContent>
            </Field>
            {isLimited && (
                <Input
                    name="attributes.editionSize"
                    label="Размер тиража"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="100"
                />
            )}
        </>
    );
};
