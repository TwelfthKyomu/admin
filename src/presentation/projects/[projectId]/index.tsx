'use client';

import { useProject } from '@/app/providers';
import { EmptyState } from '@/shared/components/common';
import { ROUTES } from '@/shared/constants';
import { projectStartTab } from '@/shared/lib/projectTabs';
import { Lock } from 'lucide-react';
import { redirect } from 'next/navigation';

export const ProjectPage = () => {
    const { projectId, permissions } = useProject();
    const startTab = projectStartTab(permissions);

    if (startTab) redirect(ROUTES.project(projectId, startTab.value));

    return (
        <EmptyState
            icon={Lock}
            title="Нет доступных разделов"
            description="Ваша роль в проекте не открывает ни один раздел."
        />
    );
};
