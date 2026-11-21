import { type ChangeEvent, useEffect, useRef, useState } from 'react';
import type { FieldPath, FieldValues } from 'react-hook-form';
import { useControlledField } from '../../useControlledField';
import { MONEY_PATTERN, minorToText, textToMinor } from '../lib/money';

export const useMoneyField = <
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
>(
    name: TName,
) => {
    const { field, error, invalid } = useControlledField<TFieldValues, TName>(
        name,
    );

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
