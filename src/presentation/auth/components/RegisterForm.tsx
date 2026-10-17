'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { signUp } from '@/shared/lib/auth-client';
import { getErrorMessage } from '@/shared/lib/errors';
import { toast } from '@/shared/lib/toast';
import { Button, FieldGroup } from '@/ui/Base';
import { Checkbox, Form, Input, PasswordInput } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { REGISTER_DEFAULT, RegisterFormSchema, type RegisterFormValues } from '../form/formData';
import { BaseInput } from './BaseInput';

interface RegisterFormProps {
    redirectTo?: string;
    defaultEmail?: string;
}

export const RegisterForm = ({ redirectTo = '/', defaultEmail }: RegisterFormProps = {}) => {
    const router = useRouter();

    const form = useForm<RegisterFormValues>({
        resolver: zodResolver(RegisterFormSchema),
        defaultValues: {
            ...REGISTER_DEFAULT,
            email: defaultEmail ?? REGISTER_DEFAULT.email,
        },
        mode: 'onChange',
    });

    const handleSubmit: SubmitHandler<RegisterFormValues> = async (values) => {
        await signUp.email(
            {
                name: values.name,
                email: values.email,
                password: values.password,
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
