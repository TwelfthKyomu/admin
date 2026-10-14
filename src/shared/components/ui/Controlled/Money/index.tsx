import { type ComponentProps, useEffect, useRef, useState } from 'react';
import { type FieldPath, type FieldValues, useController, useFormContext } from 'react-hook-form';
import { Input as BaseInput } from '@/ui/Base';
import { ControlledField } from '../Field';

interface MoneyControlledProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
> extends Omit<ComponentProps<'input'>, 'type' | 'inputMode' | 'value'> {
    name: TName;
    label?: string;
    description?: string;
}

const MONEY_PATTERN = /^\d*([.,]\d{0,2})?$/;

function minorToText(minor: number | null | undefined): string {
    return minor == null ? '' : (minor / 100).toFixed(2);
}

function textToMinor(raw: string): number | null {
    const normalized = raw.trim().replace(/,/g, '.');

    if (normalized === '') return null;

    const major = Number(normalized);

    return Number.isNaN(major) ? null : Math.round(major * 100);
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
    const { control } = useFormContext<TFieldValues>();

    const {
        field,
        fieldState: { error, invalid },
    } = useController({ name, control });

    const [rawValue, setRawValue] = useState(() => minorToText(field.value));

    const lastEmitted = useRef<number | null>(field.value ?? null);

    useEffect(() => {
        const current = field.value ?? null;

        if (current !== lastEmitted.current) {
            lastEmitted.current = current;
            setRawValue(minorToText(field.value));
        }
    }, [field.value]);

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
                onChange={(event) => {
                    const next = event.target.value;

                    if (!MONEY_PATTERN.test(next)) return;

                    setRawValue(next);
                    const minor = textToMinor(next);

                    lastEmitted.current = minor;
                    field.onChange(minor);
                }}
            />
        </ControlledField>
    );
};

export { Money };
