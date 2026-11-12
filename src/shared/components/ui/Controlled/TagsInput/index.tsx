import type { FieldPath, FieldValues } from 'react-hook-form';
import { Badge, Input as BaseInput, Button } from '@/ui/Base';
import { ControlledField } from '../Field';
import { useTagsField } from './hooks/useTagsField';

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
    const { tags, draft, setDraft, addTag, removeTag, onKeyDown, error, invalid } = useTagsField<
        TFieldValues,
        TName
    >(name);

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
