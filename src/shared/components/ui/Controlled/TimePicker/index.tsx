import type { ComponentProps } from 'react';
import { type FieldPath, type FieldValues, useController, useFormContext } from 'react-hook-form';
import { TimePicker as BaseTimePicker } from '@/ui/Base';
import { ControlledField } from '../Field';

interface TimePickerControlledProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
> extends Omit<ComponentProps<typeof BaseTimePicker>, 'value' | 'onValueChange'> {
    name: TName;
    label?: string;
    description?: string;
}

const TimePicker = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
    name,
    label,
    description,
    ...props
}: TimePickerControlledProps<TFieldValues, TName>) => {
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
            <BaseTimePicker
                id={name}
                aria-invalid={invalid}
                value={field.value ?? ''}
                onValueChange={field.onChange}
                onBlur={field.onBlur}
                disabled={field.disabled}
                {...props}
            />
        </ControlledField>
    );
};

export { TimePicker };
