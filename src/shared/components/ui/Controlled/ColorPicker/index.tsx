import { type FieldPath, type FieldValues, useController, useFormContext } from 'react-hook-form';
import { ColorPicker as BaseColorPicker } from '@/ui/Base/ColorPicker';
import { ControlledField } from '../Field';

interface ColorPickerControlledProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
> {
    name: TName;
    label?: string;
    description?: string;
    placeholder?: string;
}

const ColorPicker = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
    name,
    label,
    description,
    placeholder,
}: ColorPickerControlledProps<TFieldValues, TName>) => {
    const { control } = useFormContext<TFieldValues>();

    const {
        field,
        fieldState: { error, invalid },
    } = useController({ name, control });

    const value = typeof field.value === 'string' ? field.value : '';

    return (
        <ControlledField
            name={name}
            label={label}
            description={description}
            error={error}
        >
            <BaseColorPicker
                id={name}
                invalid={invalid}
                value={value}
                placeholder={placeholder}
                onChange={field.onChange}
                onBlur={field.onBlur}
            />
        </ControlledField>
    );
};

export { ColorPicker };
