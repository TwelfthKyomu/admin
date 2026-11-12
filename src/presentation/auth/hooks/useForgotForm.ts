'use client';

import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { authClient } from '@/shared/lib/auth-client';
import { getErrorMessage } from '@/shared/lib/errors';
import { toast } from '@/shared/lib/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    FORGOT_DEFAULT,
    ForgotFormSchema,
    type ForgotFormValues,
} from '../form/formData';

export const useForgotForm = () => {
    const [sentTo, setSentTo] = useState<string>();

    const form = useForm<ForgotFormValues>({
        resolver: zodResolver(ForgotFormSchema),
        defaultValues: FORGOT_DEFAULT,
        mode: 'onChange',
    });

    const isPending = form.formState.isSubmitting;

    const onSubmit: SubmitHandler<ForgotFormValues> = async (values) => {
        const email = values.email.trim();

        const { error } = await authClient.requestPasswordReset({
            email,
            redirectTo: '/auth/reset-password',
        });

        if (error) {
            toast.error(getErrorMessage(error));

            return;
        }

        setSentTo(email);
    };

    return { sentTo, form, isPending, onSubmit };
};
