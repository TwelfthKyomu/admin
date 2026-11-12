'use client';

import { Button, FieldGroup } from '@/ui/Base';
import { Checkbox, Form } from '@/ui/Controlled';
import { useLoginForm } from '../hooks/useLoginForm';
import { BaseInput } from './BaseInput';
import { ForgotForm } from './ForgotForm';

interface LoginFormProps {
    redirectTo?: string;
    defaultEmail?: string;
}

export const LoginForm = ({ redirectTo = '/', defaultEmail }: LoginFormProps = {}) => {
    const { showForgot, setShowForgot, form, handleSubmit } = useLoginForm(
        redirectTo,
        defaultEmail,
    );

    if (showForgot) {
        return <ForgotForm onBack={() => setShowForgot(false)} />;
    }

    return (
        <Form
            form={form}
            onSubmit={handleSubmit}
        >
            <FieldGroup>
                <BaseInput />
                <div className="flex items-center justify-between">
                    <Checkbox
                        name="remember"
                        label="Запомнить"
                    />
                    <Button
                        type="button"
                        size="xs"
                        variant="link"
                        onClick={() => setShowForgot(true)}
                    >
                        Забыли пароль?
                    </Button>
                </div>
                <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                >
                    Войти
                </Button>
            </FieldGroup>
        </Form>
    );
};
