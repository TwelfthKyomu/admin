'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { signUp } from '@/shared/lib/auth-client';
import { getErrorMessage } from '@/shared/lib/errors';
import { toast } from '@/shared/lib/toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import {
    REGISTER_DEFAULT,
    RegisterFormSchema,
    type RegisterFormValues,
} from '../form/formData';

export const useRegisterForm = (redirectTo: string, defaultEmail?: string) => {
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

    return { form, handleSubmit };
};
