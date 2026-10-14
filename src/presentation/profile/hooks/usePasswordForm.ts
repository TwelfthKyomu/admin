'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { authClient } from '@/shared/lib/auth-client';
import { toast } from '@/shared/lib/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    PASSWORD_DEFAULT,
    PasswordFormSchema,
    type PasswordFormValues,
} from '../form/formData';

export function usePasswordForm() {
    const form = useForm<PasswordFormValues>({
        resolver: zodResolver(PasswordFormSchema),
        defaultValues: PASSWORD_DEFAULT,
    });

    const onSubmit: SubmitHandler<PasswordFormValues> = async (values) => {
        const { error } = await authClient.changePassword({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword,
            revokeOtherSessions: values.revokeOtherSessions,
        });

        if (error) {
            toast.error(error.message ?? 'Не удалось сменить пароль');

            return;
        }

        toast.success('Пароль обновлён');
        form.reset(PASSWORD_DEFAULT);
    };

    return { form, onSubmit };
}
