import { type FieldPath, type FieldValues, useController, useFormContext } from 'react-hook-form';
import { InputGroupField } from '@/ui/Base/InputGroup';
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

const FALLBACK_COLOR = '#000000';

const ColorPicker = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
    name,
    label,
    description,
    placeholder = '#737373',
}: ColorPickerControlledProps<TFieldValues, TName>) => {
    const { control } = useFormContext<TFieldValues>();

    const {
        field,
        fieldState: { error, invalid },
    } = useController({ name, control });

    const value = (field.value as string) ?? '';

    return (
        <ControlledField
            name={name}
            label={label}
            description={description}
            error={error}
        >
            <InputGroupField
                id={name}
                aria-invalid={invalid}
                value={value}
                placeholder={placeholder}
                onChange={(event) => field.onChange(event.target.value)}
                onBlur={field.onBlur}
                startAddon={
                    <input
                        type="color"
                        aria-label="Выбрать цвет"
                        value={value || FALLBACK_COLOR}
                        onChange={(event) => field.onChange(event.target.value)}
                        className="size-6 cursor-pointer rounded-sm border-0 bg-transparent p-0"
                    />
                }
            />
        </ControlledField>
    );
};

export { ColorPicker };
