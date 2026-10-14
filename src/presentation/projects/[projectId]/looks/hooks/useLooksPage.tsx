'use client';

import { useProject } from '@/app/providers';
import { confirmDestructive, modal } from '@/shared/lib/modal';
import { type LookView, useDeleteLook, useLooksList } from '@/contexts/look';
import dynamic from 'next/dynamic';

const LookCreateModal = dynamic(() =>
    import('../modal/LookCreateModal').then((m) => m.LookCreateModal),
);

const LookEditSheet = dynamic(() => import('../modal/LookEditSheet').then((m) => m.LookEditSheet));

export function useLooksPage() {
    const { projectId } = useProject();
    const query = useLooksList(projectId);
    const { mutateAsync, isPending } = useDeleteLook(projectId);

    const onCreate = () => modal.open(<LookCreateModal projectId={projectId} />);

    const onEdit = (look: LookView) =>
        modal.open(
            <LookEditSheet
                projectId={projectId}
                look={look}
            />,
        );

    const onDelete = (look: LookView) =>
        confirmDestructive({
            title: 'Удалить образ?',
            description: (
                <>
                    Образ <strong>«{look.title}»</strong> пропадёт с сайта. Товары останутся в
                    каталоге.
                </>
            ),
            success: `Образ «${look.title}» удалён`,
            onConfirm: () => mutateAsync({ id: look.id, projectId }),
        });

    return { query, onCreate, onEdit, onDelete, isDeleting: isPending };
}
