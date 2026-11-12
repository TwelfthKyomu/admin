'use client';

import { FormDialog } from '@/shared/components/common';
import type { LookView } from '@/contexts/look';
import { LookForm } from '../form/LookForm';
import { useLookEditSheet } from '../hooks/useLookEditSheet';

interface LookEditSheetProps {
    projectId: string;
    look: LookView;
}

export const LookEditSheet = ({ projectId, look }: LookEditSheetProps) => {
    const { isPending, form, onSubmit } = useLookEditSheet(projectId, look);

    return (
        <FormDialog
            surface="sheet"
            title="Изменить образ"
            description="Фото с несколькими товарами. На сайте покупатель увидит отметки и сможет взять весь образ."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Сохранить"
            busy={isPending}
        >
            <LookForm projectId={projectId} />
        </FormDialog>
    );
};
