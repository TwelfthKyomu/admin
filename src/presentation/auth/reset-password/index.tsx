'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { ROUTES } from '@/shared/constants';
import { authClient } from '@/shared/lib/auth-client';
import { toast } from '@/shared/lib/toast';
import { Button, FieldGroup } from '@/ui/Base';
import { Form, PasswordInput } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    RESET_PASSWORD_DEFAULT,
    ResetPasswordFormSchema,
    type ResetPasswordFormValues,
} from './form/formData';

const InvalidTokenScreen = () => (
    <div className="flex flex-col gap-3 text-center">
        <p className="text-sm text-muted-foreground">
            Ссылка для сброса пароля недействительна или устарела. Запросите новую на странице
            входа.
        </p>
        <Button asChild>
            <Link href={ROUTES.auth}>К странице входа</Link>
        </Button>
    </div>
);

export const ResetPasswordPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const hasError = searchParams.get('error') !== null;

    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(ResetPasswordFormSchema),
        defaultValues: RESET_PASSWORD_DEFAULT,
    });

    const isPending = form.formState.isSubmitting;

    if (hasError || !token) return <InvalidTokenScreen />;

    const onSubmit: SubmitHandler<ResetPasswordFormValues> = async (values) => {
        const { error } = await authClient.resetPassword({
            newPassword: values.password,
            token,
        });

        if (error) {
            toast.error(error.message ?? 'Не удалось сменить пароль');

            return;
        }

        toast.success('Пароль обновлён — войдите с новым паролем');
        router.push(ROUTES.auth);
    };

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
