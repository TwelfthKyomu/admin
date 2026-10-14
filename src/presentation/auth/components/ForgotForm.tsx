'use client';

import { useState } from 'react';
import { type SubmitHandler, useForm } from 'react-hook-form';
import { authClient } from '@/shared/lib/auth-client';
import { getErrorMessage } from '@/shared/lib/errors';
import { toast } from '@/shared/lib/toast';
import { Button, FieldGroup } from '@/ui/Base';
import { Form, Input } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import { FORGOT_DEFAULT, ForgotFormSchema, type ForgotFormValues } from '../form/formData';

interface ForgotFormProps {
    onBack: () => void;
}

export const ForgotForm = ({ onBack }: ForgotFormProps) => {
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

    if (sentTo) {
        return (
            <div className="flex flex-col gap-3 text-center">
                <p className="text-sm text-muted-foreground">
                    Если аккаунт с адресом <strong>{sentTo}</strong> существует, мы отправили на
                    него ссылку для сброса пароля. Ссылка действует 1 час.
                </p>
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onBack}
                >
                    Вернуться ко входу
                </Button>
            </div>
        );
    }

    return (
        <Form
            form={form}
            onSubmit={onSubmit}
        >
            <FieldGroup>
                <p className="text-sm text-muted-foreground">
                    Укажите email аккаунта — пришлём ссылку для сброса пароля.
                </p>
                <Input
                    label="Электронная почта"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="your@email.com"
                />
                <Button
                    type="submit"
                    disabled={isPending}
                >
                    Отправить ссылку
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    disabled={isPending}
                    onClick={onBack}
                >
                    Вернуться ко входу
                </Button>
            </FieldGroup>
        </Form>
    );
};
