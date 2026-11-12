import { type KeyboardEvent, useState } from 'react';
import {
    type FieldPath,
    type FieldValues,
    useController,
    useFormContext,
} from 'react-hook-form';

export const useTagsField = <
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
>(
    name: TName,
) => {
    const { control } = useFormContext<TFieldValues>();

    const {
        field,
        fieldState: { error, invalid },
    } = useController({ name, control });

    const [draft, setDraft] = useState('');
    const tags: string[] = field.value ?? [];

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
        } else if (
            event.key === 'Backspace' &&
            draft === '' &&
            tags.length > 0
        ) {
            const last = tags[tags.length - 1];

            if (last !== undefined) removeTag(last);
        }
    };

    return {
        tags,
        draft,
        setDraft,
        addTag,
        removeTag,
        onKeyDown,
        error,
        invalid,
    };
};
