import { HOME_LABEL } from '@/shared/labels/navigation';
import { crumbLabel } from './crumbLabel';

interface NamedProject {
    id: string;
    name: string;
}

export const breadcrumbItems = (pathname: string, projects: NamedProject[]) => {
    const segments = pathname.split('/').filter(Boolean);

    return [
        { label: HOME_LABEL, href: '/' },
        ...segments.map((segment, index) => ({
            label: crumbLabel(
                segment,
                segments[index - 1],
                projects.find((project) => project.id === segment)?.name,
            ),
            href: `/${segments.slice(0, index + 1).join('/')}`,
        })),
    ];
};
