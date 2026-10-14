'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { useDerivedField } from '@/shared/hooks/useDerivedField';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    CreateProjectBadgeActionInputSchema,
    normalizeBadgeCode,
    useCreateProjectBadge,
} from '@/contexts/projectBadge';
import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeForm } from '../form/BadgeForm';
import { BADGE_DEFAULT, type CreateBadgeFormValues } from '../form/formData';

export const BadgeCreateModal = ({ projectId }: { projectId: string }) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateProjectBadge(projectId);

    const form = useForm<CreateBadgeFormValues>({
        defaultValues: { ...BADGE_DEFAULT, projectId },
        resolver: zodResolver(CreateProjectBadgeActionInputSchema),
        mode: 'onChange',
    });

    useDerivedField({
        form,
        from: 'label',
        to: 'code',
        derive: (label) => normalizeBadgeCode(label) ?? '',
    });

    const onSubmit: SubmitHandler<CreateBadgeFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `Бейдж «${values.label}» создан`,
        });

        if (success) close();
    };

    return (
        <FormDialog
            title="Новый бейдж"
            description="Используется во всех товарах проекта. Код менять нельзя после создания."
            className="sm:max-w-md"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Создать"
            busy={isPending}
        >
            <BadgeForm />
        </FormDialog>
    );
};
