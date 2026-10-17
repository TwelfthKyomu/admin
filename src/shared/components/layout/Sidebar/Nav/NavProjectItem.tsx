import { useStaticData } from '@/app/providers';
import { ROUTES } from '@/shared/constants';
import { useActiveUrl } from '@/shared/hooks/useActiveUrl';
import { segmentLabel } from '@/shared/labels/navigation';
import { groupedProjectTabs } from '@/shared/lib/projectTabs';
import { cn } from '@/shared/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/ui/Base';
import { ChevronRight, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import {
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from '../primitives/Sidebar';

interface NavProjectItemProps {
    id: string;
    name: string;
}

export const NavProjectItem = ({ id, name }: NavProjectItemProps) => {
    const isActive = useActiveUrl();
    const { projectPermissions } = useStaticData();
    const sections = groupedProjectTabs(projectPermissions[id] ?? []);

    const inProject = isActive(ROUTES.project(id));

    return (
        <Collapsible
            asChild
            defaultOpen={inProject}
            className="group/collapsible"
        >
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton
                        tooltip={name}
                        isActive={inProject}
                    >
                        <FolderKanban />
                        <span>{name}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub className="mx-2 gap-0 border-l-0 px-0 py-1">
                        {sections.map(({ group, tabs }, index) => (
                            <li
                                key={group}
                                className={cn('flex flex-col', index > 0 && 'mt-2.5')}
                            >
                                <span className="select-none px-2 pb-1 font-semibold text-[0.625rem] text-sidebar-foreground/45 uppercase tracking-[0.08em]">
                                    {segmentLabel(group)}
                                </span>
                                <ul className="ml-1.5 flex flex-col gap-px border-sidebar-border/70 border-l pl-1.5">
                                    {tabs.map((tab) => (
                                        <SidebarMenuSubItem key={tab.value}>
                                            <SidebarMenuSubButton
                                                asChild
                                                isActive={isActive(ROUTES.project(id, tab.value))}
                                                className="group/sub h-7 gap-2 px-2 data-active:font-medium"
                                            >
                                                <Link href={ROUTES.project(id, tab.value)}>
                                                    <span
                                                        aria-hidden
                                                        className="size-1 shrink-0 rounded-full bg-sidebar-foreground/25 transition-colors group-hover/sub:bg-sidebar-foreground/50 group-data-active/sub:bg-sidebar-primary"
                                                    />
                                                    <span className="truncate">
                                                        {segmentLabel(tab.value)}
                                                    </span>
                                                </Link>
                                            </SidebarMenuSubButton>
                                        </SidebarMenuSubItem>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
};
