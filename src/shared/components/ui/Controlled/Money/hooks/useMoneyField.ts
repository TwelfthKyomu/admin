import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import {
    type FieldPath,
    type FieldValues,
    useController,
    useFormContext,
} from 'react-hook-form';
import { MONEY_PATTERN, minorToText, textToMinor } from '../lib/money';

export const useMoneyField = <
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

    const [rawValue, setRawValue] = useState(() => minorToText(field.value));

    const lastEmitted = useRef<number | null>(field.value ?? null);

    useEffect(() => {
        const current = field.value ?? null;

        if (current !== lastEmitted.current) {
            lastEmitted.current = current;
            setRawValue(minorToText(field.value));
        }
    }, [field.value]);

    const onChange = (event: ChangeEvent<HTMLInputElement>) => {
        const next = event.target.value;

        if (!MONEY_PATTERN.test(next)) return;

        setRawValue(next);
        const minor = textToMinor(next);

        lastEmitted.current = minor;
        field.onChange(minor);
    };

    return { field, error, invalid, rawValue, onChange };
};
