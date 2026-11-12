'use client';

import { Button, FieldGroup } from '@/ui/Base';
import { Form, PasswordInput } from '@/ui/Controlled';
import { InvalidTokenScreen } from './components/InvalidTokenScreen';
import { useResetPasswordForm } from './hooks/useResetPasswordForm';

export const ResetPasswordPage = () => {
    const { form, onSubmit, isValidLink, isPending } = useResetPasswordForm();

    if (!isValidLink) return <InvalidTokenScreen />;

    return (
        <Form
            form={form}
            onSubmit={onSubmit}
        >
            <FieldGroup>
                <PasswordInput
                    label="Новый пароль"
                    name="password"
                    autoComplete="new-password"
                />
                <PasswordInput
                    label="Повторите пароль"
                    name="confirmPassword"
                    autoComplete="new-password"
                />
                <Button
                    type="submit"
                    disabled={isPending}
                >
                    Сменить пароль
                </Button>
            </FieldGroup>
        </Form>
    );
};
