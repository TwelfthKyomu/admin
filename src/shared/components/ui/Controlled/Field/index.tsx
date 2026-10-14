import type { ReactNode } from 'react';
import type { FieldError as FormFieldError } from 'react-hook-form';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/ui/Base';

interface ControlledFieldProps {
    name: string;
    label?: string;
    description?: string;
    error?: FormFieldError;
    children: ReactNode;
}

export const ControlledField = ({
    name,
    label,
    description,
    error,
    children,
}: ControlledFieldProps) => (
    <Field data-invalid={!!error}>
        {label && <FieldLabel htmlFor={name}>{label}</FieldLabel>}
        {children}
        {description && !error && <FieldDescription>{description}</FieldDescription>}
        {error && <FieldError errors={[error]} />}
    </Field>
);
