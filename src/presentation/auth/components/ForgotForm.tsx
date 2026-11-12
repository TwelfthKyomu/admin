'use client';

import { Button, FieldGroup } from '@/ui/Base';
import { Form, Input } from '@/ui/Controlled';
import { useForgotForm } from '../hooks/useForgotForm';

interface ForgotFormProps {
    onBack: () => void;
}

export const ForgotForm = ({ onBack }: ForgotFormProps) => {
    const { sentTo, form, isPending, onSubmit } = useForgotForm();

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
