'use client';

import { useStaticData } from '@/app/providers';
import { confirmDestructive, modal } from '@/shared/lib/modal';
import { type ProjectView, useDeleteProject, useProjectsList } from '@/contexts/project';
import dynamic from 'next/dynamic';

const ProjectCreateModal = dynamic(() =>
    import('../modal/ProjectCreateModal').then((m) => m.ProjectCreateModal),
);

const ProjectEditSheet = dynamic(() =>
    import('../modal/ProjectEditSheet').then((m) => m.ProjectEditSheet),
);

export function useProjectsPage() {
    const { organization } = useStaticData();
    const query = useProjectsList(organization.id);
    const { mutateAsync, isPending } = useDeleteProject();

    const onCreate = () => modal.open(<ProjectCreateModal />);

    const onEdit = (project: ProjectView) => modal.open(<ProjectEditSheet project={project} />);

    const onDelete = (project: ProjectView) =>
        confirmDestructive({
            title: 'Удалить проект?',
            description: (
                <>
                    Проект <strong>«{project.name}»</strong> будет удалён вместе с каталогом,
                    заказами и API-ключами. Действие необратимо.
                </>
            ),
            success: `Проект «${project.name}» удалён`,
            onConfirm: () => mutateAsync({ id: project.id }),
        });

    return { query, onCreate, onEdit, onDelete, isDeleting: isPending };
}
