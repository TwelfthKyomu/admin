'use client';

import type { PropsWithChildren } from 'react';
import { useProject } from '@/app/providers';
import { EmptyState } from '@/shared/components/common';
import { canOpenProjectTab, PROJECT_TAB_META } from '@/shared/lib/projectTabs';
import { useRealtimeSync } from '@/shared/realtime/scope';
import { Lock } from 'lucide-react';
import { useSelectedLayoutSegment } from 'next/navigation';

export const ProjectShell = ({ children }: PropsWithChildren) => {
    const { project, permissions } = useProject();
    const segment = useSelectedLayoutSegment();

    useRealtimeSync([project?.id]);

    if (!project) {
        return (
            <EmptyState
                icon={Lock}
                title="Проект недоступен"
                description="Проекта нет или вы в нём не участвуете."
            />
        );
    }

    const tab = PROJECT_TAB_META.find((item) => item.value === segment);

    if (tab && !canOpenProjectTab(tab, permissions)) {
        return (
            <EmptyState
                icon={Lock}
                title="Нет доступа к разделу"
                description="Ваша роль в проекте не открывает этот раздел."
            />
        );
    }

    return <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</div>;
};
