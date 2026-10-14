'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    type ProjectBadgeView,
    UpdateProjectBadgeActionInputSchema,
    useUpdateProjectBadge,
} from '@/contexts/projectBadge';
import { zodResolver } from '@hookform/resolvers/zod';
import { BadgeForm } from '../form/BadgeForm';
import type { UpdateBadgeFormValues } from '../form/formData';

interface BadgeEditSheetProps {
    projectId: string;
    badge: ProjectBadgeView;
}

export const BadgeEditSheet = ({ projectId, badge }: BadgeEditSheetProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateProjectBadge(projectId);

    const form = useForm<UpdateBadgeFormValues>({
        values: { ...badge, projectId },
        resolver: zodResolver(UpdateProjectBadgeActionInputSchema),
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<UpdateBadgeFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `Бейдж «${badge.label}» обновлён`,
        });

        if (success) close();
    };

    return (
        <FormDialog
            surface="sheet"
            title="Изменить бейдж"
            description="Используется во всех товарах проекта. Код менять нельзя после создания."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Сохранить"
            busy={isPending}
        >
            <BadgeForm disableCode />
        </FormDialog>
    );
};
