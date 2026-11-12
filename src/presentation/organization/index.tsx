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
import { Form, Input } from '@/ui/Controlled';
import { useCreateOrganizationPage } from './hooks/useCreateOrganizationPage';

export const CreateOrganizationPage = () => {
    const { isPending, form, onSubmit } = useCreateOrganizationPage();

    return (
        <div className="m-auto flex min-h-dvh min-w-[20vw] items-center justify-center p-6">
            <Card className="w-full max-w-sm p-4">
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
                                placeholder="Введите название организации"
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
