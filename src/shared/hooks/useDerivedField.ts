import { useEffect } from 'react';
import {
    type FieldValues,
    type Path,
    type PathValue,
    type UseFormReturn,
    useWatch,
} from 'react-hook-form';

type UseDerivedFieldOptions<
    TValues extends FieldValues,
    TFrom extends Path<TValues>,
    TTo extends Path<TValues>,
> = {
    form: UseFormReturn<TValues>;
    from: TFrom;
    to: TTo;
    derive: (source: PathValue<TValues, TFrom>) => PathValue<TValues, TTo>;
};

export function useDerivedField<
    TValues extends FieldValues,
    TFrom extends Path<TValues>,
    TTo extends Path<TValues>,
>({ form, from, to, derive }: UseDerivedFieldOptions<TValues, TFrom, TTo>) {
    const sourceValue = useWatch({ control: form.control, name: from });

    useEffect(() => {
        if (form.getFieldState(to).isTouched) return;

        form.setValue(to, derive(sourceValue));
    }, [sourceValue]);
}
