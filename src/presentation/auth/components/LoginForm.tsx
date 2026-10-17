'use client';

import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { signIn } from '@/shared/lib/auth-client';
import { getErrorMessage } from '@/shared/lib/errors';
import { toast } from '@/shared/lib/toast';
import { Button, FieldGroup } from '@/ui/Base';
import { Checkbox, Form } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { LOGIN_DEFAULT, LoginFormSchema, type LoginFormValues } from '../form/formData';
import { BaseInput } from './BaseInput';
import { ForgotForm } from './ForgotForm';

interface LoginFormProps {
    redirectTo?: string;
    defaultEmail?: string;
}

export const LoginForm = ({ redirectTo = '/', defaultEmail }: LoginFormProps = {}) => {
    const [showForgot, setShowForgot] = useState(false);
    const router = useRouter();

    const form = useForm({
        resolver: zodResolver(LoginFormSchema),
        defaultValues: { ...LOGIN_DEFAULT, email: defaultEmail ?? LOGIN_DEFAULT.email },
        mode: 'onChange',
    });

    const handleSubmit: SubmitHandler<LoginFormValues> = async (values) => {
        await signIn.email(
            {
                email: values.email,
                password: values.password,
                rememberMe: values.remember,
                callbackURL: redirectTo,
            },
            {
                onSuccess: () => {
                    router.push(redirectTo);
                },
                onError: ({ error }) => {
                    toast.error(getErrorMessage(error));
                },
            },
        );
    };

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
