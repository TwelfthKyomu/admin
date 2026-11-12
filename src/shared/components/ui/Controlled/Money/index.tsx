import type { ComponentProps } from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';
import { Input as BaseInput } from '@/ui/Base';
import { ControlledField } from '../Field';
import { useMoneyField } from './hooks/useMoneyField';

interface MoneyControlledProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
> extends Omit<ComponentProps<'input'>, 'type' | 'inputMode' | 'value'> {
    name: TName;
    label?: string;
    description?: string;
}

const Money = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
    name,
    label,
    description,
    ...props
}: MoneyControlledProps<TFieldValues, TName>) => {
    const { field, error, invalid, rawValue, onChange } = useMoneyField<TFieldValues, TName>(name);

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
                inputMode="decimal"
                {...field}
                {...props}
                type="text"
                value={rawValue}
                onChange={onChange}
            />
        </ControlledField>
    );
};

export { Money };
