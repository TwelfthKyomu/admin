import { useState } from 'react';
import { type FieldPath, type FieldValues, useController, useFormContext } from 'react-hook-form';
import {
    InputGroup,
    InputGroupAddon,
    InputGroupButton,
    InputGroupInput,
} from '@/ui/Base/InputGroup';
import { Eye, EyeOff } from 'lucide-react';
import { ControlledField } from '../Field';

interface PasswordInputProps<
    TFieldValues extends FieldValues,
    TName extends FieldPath<TFieldValues>,
> {
    name: TName;
    label?: string;
    autoComplete?: 'current-password' | 'new-password';
}

export const PasswordInput = <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
    name,
    label,
    autoComplete,
}: PasswordInputProps<TFieldValues, TName>) => {
    const [show, setShow] = useState(false);

    const { control } = useFormContext<TFieldValues>();

    const {
        field,
        fieldState: { error, invalid },
    } = useController({
        name,
        control,
    });

    return (
        <ControlledField
            name={name}
            label={label}
            error={error}
        >
            <InputGroup>
                <InputGroupInput
                    {...field}
                    id={name}
                    type={show ? 'text' : 'password'}
                    autoComplete={autoComplete}
                    aria-invalid={invalid}
                    placeholder={
                        autoComplete === 'new-password'
                            ? 'Минимум 8 символов, заглавная буква и цифра'
                            : 'Ваш пароль'
                    }
                />

                <InputGroupAddon align="inline-end">
                    <InputGroupButton
                        type="button"
                        aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
                        onClick={() => setShow((v) => !v)}
                    >
                        {show ? <EyeOff /> : <Eye />}
                    </InputGroupButton>
                </InputGroupAddon>
            </InputGroup>
        </ControlledField>
    );
};
