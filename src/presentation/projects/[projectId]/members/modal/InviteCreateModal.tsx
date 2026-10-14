'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { ROUTES } from '@/shared/constants';
import { absoluteUrl } from '@/shared/format/url';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { toast } from '@/shared/lib/toast';
import {
    CreateProjectInviteActionInputSchema,
    useCreateProjectInvite,
} from '@/contexts/projectInvite';
import { FieldGroup } from '@/ui/Base';
import { InputGroup, optionalStringTransform } from '@/ui/Controlled';
import { zodResolver } from '@hookform/resolvers/zod';
import { type CreateInviteFormValues, INVITE_DEFAULT } from '../form/formData';

interface CreateInviteModalProps {
    projectId: string;
}

export const InviteCreateModal = ({ projectId }: CreateInviteModalProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateProjectInvite(projectId);

    const form = useForm<CreateInviteFormValues>({
        resolver: zodResolver(CreateProjectInviteActionInputSchema),
        defaultValues: { ...INVITE_DEFAULT, projectId },
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<CreateInviteFormValues> = async (values) => {
        const { success, response } = await runAction(
            mutateAsync({
                projectId,
                email: values.email,
            }),
        );

        if (!success) return;

        const token = response?.data?.token;

        if (token) {
            await navigator.clipboard.writeText(absoluteUrl(ROUTES.invite(token))).catch(() => {});
            toast.success('Ссылка создана и скопирована. Код — в списке ниже.');
        }

        close();
    };

    return (
        <FormDialog
            title="Пригласить в проект"
            description="Создайте ссылку-приглашение. Кто перейдёт по ней и войдёт — присоединится к проекту."
            className="max-w-md"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Создать ссылку"
            requireValid={false}
            requireDirty={false}
            busy={isPending}
        >
            <FieldGroup>
                <InputGroup
                    name="email"
                    label="Email (необязательно, для себя)"
                    type="email"
                    placeholder="master@example.com"
                    transform={optionalStringTransform}
                />
            </FieldGroup>
        </FormDialog>
    );
};
