'use client';

import { createContext, type PropsWithChildren, useContext } from 'react';
import { type Currency, DEFAULT_CURRENCY } from '@/shared/constants/currency';
import type { ProjectView } from '@/contexts/project';
import { hasPermission, type Permission, type PermissionRequirement } from '@/contexts/user';
import { useParams } from 'next/navigation';
import { useStaticData } from './StaticDataProvider';

interface ProjectContextType {
    projectId: string;
    project?: ProjectView;
    currency: Currency;
    permissions: Permission[];
    can: (requirement: PermissionRequirement) => boolean;
}

const ProjectContext = createContext<ProjectContextType | null>(null);

export const ProjectProvider = ({ children }: PropsWithChildren) => {
    const { projectId } = useParams<{ projectId: string }>();
    const { projects, projectPermissions } = useStaticData();

    const permissions = projectPermissions[projectId] ?? [];
    const project = projects?.find(({ id }) => id === projectId);

    return (
        <ProjectContext.Provider
            value={{
                projectId,
                project,
                currency: project?.defaultCurrency ?? DEFAULT_CURRENCY,
                permissions,
                can: (requirement) => hasPermission(permissions, requirement),
            }}
        >
            {children}
        </ProjectContext.Provider>
    );
};

export function useProject() {
    const ctx = useContext(ProjectContext);

    if (!ctx) throw new Error('useProject must be used within <ProjectProvider>');

    return ctx;
}
