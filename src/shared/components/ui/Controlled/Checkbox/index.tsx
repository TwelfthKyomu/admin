import type { ComponentProps } from 'react';
import { type FieldPath, type FieldValues, useController, useFormContext } from 'react-hook-form';
import {
    Checkbox as BaseCheckbox,
    Field,
    FieldContent,
    FieldDescription,
    FieldLabel,
} from '@/ui/Base';

interface CheckboxControlledProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
> extends Omit<ComponentProps<typeof BaseCheckbox>, 'name' | 'checked' | 'onCheckedChange'> {
    name: TName;
    label?: string;
    description?: string;
}

const Checkbox = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
    name,
    label,
    description,
    ...props
}: CheckboxControlledProps<TFieldValues, TName>) => {
    const { control } = useFormContext<TFieldValues>();

    const {
        field,
        fieldState: { error, invalid },
    } = useController({ name, control });

    return (
        <Field
            orientation="horizontal"
            data-invalid={invalid}
            className="gap-2"
        >
            <BaseCheckbox
                id={name}
                aria-invalid={invalid}
                checked={field.value}
                onCheckedChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
                {...props}
            />
            {(label || description || error) && (
                <FieldContent>
                    {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
                    {description && !error && <FieldDescription>{description}</FieldDescription>}
                    {error && (
                        <FieldDescription className="text-destructive">
                            {error.message}
                        </FieldDescription>
                    )}
                </FieldContent>
            )}
        </Field>
    );
};

export { Checkbox };
