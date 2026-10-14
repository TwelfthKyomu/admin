import type { PropsWithChildren } from 'react';
import { ProjectProvider } from '@/app/providers';
import { ProjectShell } from '@/presentation/projects/[projectId]/components/ProjectShell';

const ProjectLayout = ({ children }: PropsWithChildren) => (
    <ProjectProvider>
        <ProjectShell>{children}</ProjectShell>
    </ProjectProvider>
);

export default ProjectLayout;
