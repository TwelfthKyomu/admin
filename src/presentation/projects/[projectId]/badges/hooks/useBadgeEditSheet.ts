'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import {
    type ProjectBadgeView,
    UpdateProjectBadgeActionInputSchema,
    useUpdateProjectBadge,
} from '@/contexts/projectBadge';
import { zodResolver } from '@hookform/resolvers/zod';
import type { UpdateBadgeFormValues } from '../form/formData';

export const useBadgeEditSheet = (
    projectId: string,
    badge: ProjectBadgeView,
) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateProjectBadge();

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

    return { isPending, form, onSubmit };
};
