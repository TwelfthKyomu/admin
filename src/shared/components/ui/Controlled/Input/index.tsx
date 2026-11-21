import type { ComponentProps } from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';
import { Input as BaseInput } from '@/ui/Base';
import { ControlledField } from '../Field';
import { useControlledField } from '../useControlledField';

interface InputControlledProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
> extends ComponentProps<'input'> {
    name: TName;
    label?: string;
    description?: string;
}

const Input = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
    name,
    label,
    description,
    ...props
}: InputControlledProps<TFieldValues, TName>) => {
    const { field, error, invalid } = useControlledField<TFieldValues, TName>(name);

    const isNumber = props.type === 'number';

    return (
        <ControlledField
            name={name}
            label={label}
            description={description}
            error={error}
        >
            <BaseInput
                id={name}
                aria-invalid={invalid}
                {...field}
                {...props}
                value={field.value ?? ''}
                onChange={(event) => {
                    if (isNumber) {
                        const value = event.target.valueAsNumber;

                        field.onChange(Number.isNaN(value) ? undefined : value);
                    } else {
                        field.onChange(event);
                    }
                }}
            />
        </ControlledField>
    );
};

export { Input };
