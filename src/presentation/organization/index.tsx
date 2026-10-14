'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import {
    CreateOrganizationActionInputSchema,
    useCreateOrganization,
} from '@/contexts/organization';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import type { CreateOrganizationFormValues } from './form/formData';

export const CreateOrganizationPage = () => {
    const { push } = useRouter();
    const { mutateAsync, isPending } = useCreateOrganization();

    const form = useForm<CreateOrganizationFormValues>({
        resolver: zodResolver(CreateOrganizationActionInputSchema),
        defaultValues: { name: '' },
        mode: 'onBlur',
    });

    const onSubmit: SubmitHandler<CreateOrganizationFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: 'Организация создана',
        });

        if (!success) return;

        push('/');
    };

    return (
        <div className="m-auto flex min-h-dvh min-w-[20vw] items-center justify-center p-6">
            <Card className="w-1/4 p-4">
                <CardHeader>
                    <CardTitle>Создайте организацию</CardTitle>
                    <CardDescription>
                        Организация — это ваше рабочее пространство. Без неё работа в системе
                        невозможна.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form
                        form={form}
                        onSubmit={onSubmit}
                    >
                        <FieldGroup>
                            <Input
                                name="name"
                                label="Название"
                                placeholder="Введите названия организации"
                                autoComplete="off"
                            />
                            <Button
                                type="submit"
                                disabled={isPending || !form.formState.isValid}
                            >
                                Создать организацию
                            </Button>
                        </FieldGroup>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
};
