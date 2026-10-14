'use client';

import { createContext, type PropsWithChildren, useContext } from 'react';
import type { UserOrganizationView } from '@/contexts/organization';
import type { ProjectView } from '@/contexts/project';
import type { Permission } from '@/contexts/user';
import type { User } from '@/types/better-auth';

interface StaticDataContextType {
    organization: UserOrganizationView;
    projects?: ProjectView[];
    projectPermissions: Record<string, Permission[]>;
    user: User;
}

const StaticDataContext = createContext<StaticDataContextType | null>(null);

export const StaticDataProvider = ({
    children,
    ...data
}: StaticDataContextType & PropsWithChildren) => {
    return <StaticDataContext.Provider value={data}>{children}</StaticDataContext.Provider>;
};

export function useStaticData() {
    const ctx = useContext(StaticDataContext);

    if (!ctx) throw new Error('useStaticData must be used within <StaticDataProvider>');

    return ctx;
}
