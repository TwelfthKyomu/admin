'use client';

import { useProject } from '@/app/providers';
import { confirmDestructive, modal } from '@/shared/lib/modal';
import {
    type ProjectBadgeView,
    useDeleteProjectBadge,
    useProjectBadgesList,
} from '@/contexts/projectBadge';
import dynamic from 'next/dynamic';

const BadgeCreateModal = dynamic(() =>
    import('../modal/BadgeCreateModal').then((m) => m.BadgeCreateModal),
);

const BadgeEditSheet = dynamic(() =>
    import('../modal/BadgeEditSheet').then((m) => m.BadgeEditSheet),
);

export function useBadgesPage() {
    const { projectId } = useProject();
    const query = useProjectBadgesList({ projectId, includeInactive: true });
    const { mutateAsync, isPending } = useDeleteProjectBadge(projectId);

    const onCreate = () => modal.open(<BadgeCreateModal projectId={projectId} />);

    const onEdit = (badge: ProjectBadgeView) =>
        modal.open(
            <BadgeEditSheet
                projectId={projectId}
                badge={badge}
            />,
        );

    const onDelete = (badge: ProjectBadgeView) =>
        confirmDestructive({
            title: 'Удалить бейдж?',
            description: (
                <>
                    Бейдж <strong>«{badge.label}»</strong> будет убран из каталога. Товары, у
                    которых он стоит, потеряют эту метку.
                </>
            ),
            success: `Бейдж «${badge.label}» удалён`,
            onConfirm: () => mutateAsync({ id: badge.id, projectId }),
        });

    return { query, onCreate, onEdit, onDelete, isDeleting: isPending };
}
