'use client';

import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { signIn } from '@/shared/lib/auth-client';
import { getErrorMessage } from '@/shared/lib/errors';
import { toast } from '@/shared/lib/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
    LOGIN_DEFAULT,
    LoginFormSchema,
    type LoginFormValues,
} from '../form/formData';

export const useLoginForm = (redirectTo: string, defaultEmail?: string) => {
    const [showForgot, setShowForgot] = useState(false);
    const router = useRouter();

    const form = useForm({
        resolver: zodResolver(LoginFormSchema),
        defaultValues: {
            ...LOGIN_DEFAULT,
            email: defaultEmail ?? LOGIN_DEFAULT.email,
        },
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

    return { showForgot, setShowForgot, form, handleSubmit };
};
