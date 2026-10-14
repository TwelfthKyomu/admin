import type { ComponentProps } from 'react';
import { type FieldPath, type FieldValues, useController, useFormContext } from 'react-hook-form';
import { Textarea as BaseTextarea } from '@/ui/Base';
import { ControlledField } from '../Field';

interface TextareaControlledProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
> extends Omit<ComponentProps<'textarea'>, 'name'> {
    name: TName;
    label?: string;
    description?: string;
}

const Textarea = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
    name,
    label,
    description,
    ...props
}: TextareaControlledProps<TFieldValues, TName>) => {
    const { control } = useFormContext<TFieldValues>();

    const {
        field,
        fieldState: { error, invalid },
    } = useController({ name, control });

    return (
        <ControlledField
            name={name}
            label={label}
            description={description}
            error={error}
        >
            <BaseTextarea
                id={name}
                aria-invalid={invalid}
                {...field}
                {...props}
            />
        </ControlledField>
    );
};

export { Textarea };
