'use client';

import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    FieldGroup,
} from '@/ui/Base';
import { Checkbox, Form, PasswordInput } from '@/ui/Controlled';
import type { PasswordFormValues } from '../form/formData';
import { usePasswordForm } from '../hooks/usePasswordForm';

export const PasswordCard = () => {
    const { form, onSubmit } = usePasswordForm();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Пароль</CardTitle>
                <CardDescription>
                    Минимум 8 символов: заглавная и строчная буквы и цифра.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form
                    form={form}
                    onSubmit={onSubmit}
                >
                    <FieldGroup>
                        <PasswordInput<PasswordFormValues>
                            name="currentPassword"
                            label="Текущий пароль"
                            autoComplete="current-password"
                        />
                        <PasswordInput<PasswordFormValues>
                            name="newPassword"
                            label="Новый пароль"
                            autoComplete="new-password"
                        />
                        <PasswordInput<PasswordFormValues>
                            name="confirmPassword"
                            label="Повторите пароль"
                            autoComplete="new-password"
                        />
                        <Checkbox<PasswordFormValues>
                            name="revokeOtherSessions"
                            label="Выйти на остальных устройствах"
                        />
                        <Button
                            type="submit"
                            className="self-start"
                            disabled={form.formState.isSubmitting}
                        >
                            Сменить пароль
                        </Button>
                    </FieldGroup>
                </Form>
            </CardContent>
        </Card>
    );
};
