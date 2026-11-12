'use client';

import { Button, FieldGroup } from '@/ui/Base';
import { Checkbox, Form, Input, PasswordInput } from '@/ui/Controlled';
import { useRegisterForm } from '../hooks/useRegisterForm';
import { BaseInput } from './BaseInput';

interface RegisterFormProps {
    redirectTo?: string;
    defaultEmail?: string;
}

export const RegisterForm = ({ redirectTo = '/', defaultEmail }: RegisterFormProps = {}) => {
    const { form, handleSubmit } = useRegisterForm(redirectTo, defaultEmail);

    return (
        <Form
            form={form}
            onSubmit={handleSubmit}
        >
            <FieldGroup>
                <Input
                    name="name"
                    label="Имя"
                />
                <BaseInput newPassword />
                <PasswordInput
                    name="confirmPassword"
                    label="Повторите пароль"
                    autoComplete="new-password"
                />
                <Checkbox
                    name="agreedToTerms"
                    label="Понимаю, что это демо-версия, и ввожу только тестовые данные"
                />
                <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                >
                    Зарегистрироваться
                </Button>
            </FieldGroup>
        </Form>
    );
};
