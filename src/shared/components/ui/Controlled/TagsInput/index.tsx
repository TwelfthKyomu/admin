import { type KeyboardEvent, useState } from 'react';
import { type FieldPath, type FieldValues, useController, useFormContext } from 'react-hook-form';
import { Badge, Input as BaseInput, Button } from '@/ui/Base';
import { ControlledField } from '../Field';

interface TagsInputControlledProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
> {
    name: TName;
    label?: string;
    description?: string;
    placeholder?: string;
}

const TagsInput = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
    name,
    label,
    description,
    placeholder = 'Добавить и нажать Enter',
}: TagsInputControlledProps<TFieldValues, TName>) => {
    const { control } = useFormContext<TFieldValues>();

    const {
        field,
        fieldState: { error, invalid },
    } = useController({ name, control });

    const [draft, setDraft] = useState('');
    const tags = (field.value as string[] | undefined) ?? [];

    const addTag = () => {
        const value = draft.trim();

        if (value && !tags.includes(value)) {
            field.onChange([...tags, value]);
        }

        setDraft('');
    };

    const removeTag = (value: string) => {
        field.onChange(tags.filter((tag) => tag !== value));
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault();
            addTag();
        } else if (event.key === 'Backspace' && draft === '' && tags.length > 0) {
            const last = tags[tags.length - 1];

            if (last !== undefined) removeTag(last);
        }
    };

    return (
        <ControlledField
            name={name}
            label={label}
            description={description}
            error={error}
        >
            {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="gap-1"
                        >
                            {tag}
                            <Button
                                type="button"
                                size="icon-xs"
                                variant="ghost"
                                className="-mr-1 size-4"
                                aria-label={`Удалить ${tag}`}
                                onClick={() => removeTag(tag)}
                            >
                                ×
                            </Button>
                        </Badge>
                    ))}
                </div>
            )}
            <BaseInput
                id={name}
                aria-invalid={invalid}
                value={draft}
                placeholder={placeholder}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={onKeyDown}
                onBlur={addTag}
            />
        </ControlledField>
    );
};

export { TagsInput };
