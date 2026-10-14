'use client';

import { useStaticData } from '@/app/providers';
import { ROUTES } from '@/shared/constants';
import { useActiveUrl } from '@/shared/hooks/useActiveUrl';
import { modal } from '@/shared/lib/modal';
import { canInOrg } from '@/contexts/organizationMember/OrganizationMember.types';
import { Permission } from '@/contexts/user/User.types';
import { MoreHorizontal, Plus } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '../primitives/Sidebar';
import { NavProjectItem } from './NavProjectItem';

const ProjectCreateModal = dynamic(() =>
    import('@/presentation/projects/modal/ProjectCreateModal').then((m) => m.ProjectCreateModal),
);

export const NavProjects = () => {
    const { projects, organization } = useStaticData();
    const isActive = useActiveUrl();
    const canCreate = canInOrg(organization.role, Permission.MANAGE_ORGANIZATION);

    return (
        <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            <SidebarGroupLabel>Проекты</SidebarGroupLabel>
            <SidebarMenu>
                {projects?.map(({ id, name }) => (
                    <NavProjectItem
                        key={id}
                        id={id}
                        name={name}
                    />
                ))}
                {!projects?.length && canCreate && (
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={() => modal.open(() => <ProjectCreateModal />)}>
                            <span>Создать проект</span>
                            <Plus className="ml-auto" />
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
                {!!projects?.length && (
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            isActive={isActive(ROUTES.projects, true)}
                            asChild
                            className="text-sidebar-foreground/70"
                        >
                            <Link href={ROUTES.projects}>
                                <MoreHorizontal className="text-sidebar-foreground/70" />
                                <span>Все проекты</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                )}
            </SidebarMenu>
        </SidebarGroup>
    );
};
