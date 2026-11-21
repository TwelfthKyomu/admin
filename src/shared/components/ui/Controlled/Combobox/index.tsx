import type { FieldPath, FieldPathValue, FieldValues } from 'react-hook-form';
import type { Option } from '@/shared/types';
import { Combobox as BaseCombobox } from '@/ui/Base';
import { ControlledField } from '../Field';
import { useControlledField } from '../useControlledField';

interface ComboboxControlledProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
    TValue extends FieldPathValue<TFieldValues, TName> & string,
> {
    name: TName;
    label?: string;
    description?: string;
    options: ReadonlyArray<Option<TValue>>;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    onValueChange?: (value: TValue) => void;
}

const Combobox = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
    TValue extends FieldPathValue<TFieldValues, TName> & string = FieldPathValue<
        TFieldValues,
        TName
    > &
        string,
>({
    name,
    label,
    description,
    options,
    placeholder,
    searchPlaceholder,
    emptyText,
    onValueChange,
}: ComboboxControlledProps<TFieldValues, TName, TValue>) => {
    const { field, error } = useControlledField<TFieldValues, TName>(name);

    return (
        <ControlledField
            name={name}
            label={label}
            description={description}
            error={error}
        >
            <BaseCombobox<TValue>
                id={name}
                options={options}
                value={field.value}
                onValueChange={(next) => {
                    field.onChange(next);
                    onValueChange?.(next);
                }}
                placeholder={placeholder}
                searchPlaceholder={searchPlaceholder}
                emptyText={emptyText}
            />
        </ControlledField>
    );
};

export { Combobox };
