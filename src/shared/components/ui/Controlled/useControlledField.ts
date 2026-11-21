import {
    type FieldPath,
    type FieldValues,
    useController,
    useFormContext,
} from 'react-hook-form';

export const useControlledField = <
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

    return { field, error, invalid };
};
