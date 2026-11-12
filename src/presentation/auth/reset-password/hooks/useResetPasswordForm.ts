'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { ROUTES } from '@/shared/constants';
import { authClient } from '@/shared/lib/auth-client';
import { toast } from '@/shared/lib/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    RESET_PASSWORD_DEFAULT,
    ResetPasswordFormSchema,
    type ResetPasswordFormValues,
} from '../form/formData';

export const useResetPasswordForm = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');
    const hasError = searchParams.get('error') !== null;

    const form = useForm<ResetPasswordFormValues>({
        resolver: zodResolver(ResetPasswordFormSchema),
        defaultValues: RESET_PASSWORD_DEFAULT,
    });

    const onSubmit: SubmitHandler<ResetPasswordFormValues> = async (values) => {
        if (!token) return;

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

    return {
        form,
        onSubmit,
        isValidLink: !hasError && Boolean(token),
        isPending: form.formState.isSubmitting,
    };
};
