'use client';

import { FormDialog } from '@/shared/components/common';
import type { ProjectBadgeView } from '@/contexts/projectBadge';
import { BadgeForm } from '../form/BadgeForm';
import { useBadgeEditSheet } from '../hooks/useBadgeEditSheet';

interface BadgeEditSheetProps {
    projectId: string;
    badge: ProjectBadgeView;
}

export const BadgeEditSheet = ({ projectId, badge }: BadgeEditSheetProps) => {
    const { isPending, form, onSubmit } = useBadgeEditSheet(projectId, badge);

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
