import type { ComponentProps } from 'react';
import { type FieldPath, type FieldValues, useController, useFormContext } from 'react-hook-form';
import { DatePicker as BaseDatePicker } from '@/ui/Base';
import { ControlledField } from '../Field';

interface DatePickerControlledProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
> extends Omit<ComponentProps<typeof BaseDatePicker>, 'value' | 'onValueChange'> {
    name: TName;
    label?: string;
    description?: string;
}

const DatePicker = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
    name,
    label,
    description,
    ...props
}: DatePickerControlledProps<TFieldValues, TName>) => {
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
            <BaseDatePicker
                id={name}
                aria-invalid={invalid}
                value={field.value ?? undefined}
                onValueChange={(date) => field.onChange(date ?? null)}
                onBlur={field.onBlur}
                disabled={field.disabled}
                {...props}
            />
        </ControlledField>
    );
};

export { DatePicker };
