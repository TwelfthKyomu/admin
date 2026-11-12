import type { PropsWithChildren } from 'react';
import { StaticDataProvider } from '@/app/providers';
import { requireContext } from '@/infrastructure/auth/requireContext';
import { listProjectPermissions } from '@/shared/api/permission';
import { ModalRoot } from '@/shared/components/common';
import { nullToOptional } from '@/shared/lib/optional';
import { listOrganizationProjects } from '@/contexts/project/Project.lib';
import { Sidebar } from '@/layout/index';
import { Header } from '@/layout/Sidebar/Header';
import { SidebarInset } from '@/layout/Sidebar/primitives/Sidebar';

export const PrivateShell = async ({ children }: PropsWithChildren) => {
    const { user, organization } = await requireContext();

    const [projects, projectPermissions] = await Promise.all([
        listOrganizationProjects(organization.id),
        listProjectPermissions(user.id),
    ]);

    return (
        <StaticDataProvider
            user={user}
            organization={nullToOptional(organization)}
            projects={nullToOptional(projects.filter((project) => projectPermissions[project.id]))}
            projectPermissions={projectPermissions}
        >
            <Sidebar variant="inset" />
            <SidebarInset className="max-h-[calc(100svh-1rem)] overflow-hidden">
                <Header />
                <div className="@container/main gap-2 flex min-h-0 flex-1 flex-col md:gap-2 overflow-y-auto p-4">
                    {children}
                </div>
            </SidebarInset>
            <ModalRoot />
        </StaticDataProvider>
    );
};
