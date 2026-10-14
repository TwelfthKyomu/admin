import type { ComponentProps, ReactNode } from 'react';
import { type FieldPath, type FieldValues, useController, useFormContext } from 'react-hook-form';
import { InputGroupField } from '@/ui/Base/InputGroup';
import { ControlledField } from '../Field';

export interface InputGroupTransform {
    format: (value: unknown) => string;
    parse: (raw: string) => unknown;
}

interface InputGroupControlledProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
> extends Omit<ComponentProps<'input'>, 'prefix' | 'value' | 'defaultValue'> {
    name: TName;
    label?: string;
    description?: string;
    startAddon?: ReactNode;
    endAddon?: ReactNode;
    transform?: InputGroupTransform;
}

const identity: InputGroupTransform = {
    format: (value) => (value == null ? '' : String(value)),
    parse: (raw) => raw,
};

const InputGroup = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
    name,
    label,
    description,
    startAddon,
    endAddon,
    transform = identity,
    ...props
}: InputGroupControlledProps<TFieldValues, TName>) => {
    const { control } = useFormContext<TFieldValues>();

    const {
        field,
        fieldState: { error, invalid },
    } = useController({ name, control });

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
                startAddon={startAddon}
                endAddon={endAddon}
                value={transform.format(field.value)}
                onChange={(event) => field.onChange(transform.parse(event.target.value))}
                onBlur={field.onBlur}
                {...props}
            />
        </ControlledField>
    );
};

export const moneyTransform: InputGroupTransform = {
    format: (value) => (value == null || value === '' ? '' : String(Number(value) / 100)),
    parse: (raw) => (raw.trim() === '' ? null : Math.round(Number(raw) * 100)),
};

export const requiredIntTransform: InputGroupTransform = {
    format: (value) => (value == null ? '' : String(value)),
    parse: (raw) => (raw.trim() === '' ? undefined : Math.round(Number(raw))),
};

export const optionalIntTransform: InputGroupTransform = {
    format: (value) => (value == null ? '' : String(value)),
    parse: (raw) => (raw.trim() === '' ? null : Math.round(Number(raw))),
};

export const optionalStringTransform: InputGroupTransform = {
    format: (value) => (value == null ? '' : String(value)),
    parse: (raw) => (raw.trim() === '' ? undefined : raw),
};

export { InputGroup };
