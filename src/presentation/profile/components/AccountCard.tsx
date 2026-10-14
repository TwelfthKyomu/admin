'use client';

import { useStaticData } from '@/app/providers';
import { UserAvatar } from '@/shared/components/common';
import {
    Button,
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    FieldGroup,
} from '@/ui/Base';
import { Form, Input } from '@/ui/Controlled';
import type { AccountFormValues } from '../form/formData';
import { useAccountForm } from '../hooks/useAccountForm';

export const AccountCard = () => {
    const { user } = useStaticData();
    const { form, onSubmit } = useAccountForm();

    return (
        <Card>
            <CardHeader>
                <CardTitle>Учётная запись</CardTitle>
                <CardDescription>Как вас видят в организации.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form
                    form={form}
                    onSubmit={onSubmit}
                >
                    <FieldGroup>
                        <div className="flex items-center gap-4">
                            <UserAvatar
                                name={user.name}
                                image={user.image ?? undefined}
                                className="size-14"
                            />
                            <span className="truncate text-sm text-muted-foreground">
                                {user.email}
                            </span>
                        </div>
                        <Input<AccountFormValues>
                            name="name"
                            label="Имя"
                            autoComplete="name"
                        />
                        <Button
                            type="submit"
                            className="self-start"
                            disabled={form.formState.isSubmitting || !form.formState.isDirty}
                        >
                            Сохранить
                        </Button>
                    </FieldGroup>
                </Form>
            </CardContent>
        </Card>
    );
};
