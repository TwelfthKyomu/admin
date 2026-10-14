'use client';

import type { ComponentProps } from 'react';
import { Logo } from '@/layout/Sidebar/Logo';
import { NavMain } from '@/layout/Sidebar/Nav/NavMain';
import { NavProjects } from '@/layout/Sidebar/Nav/NavProject';
import { NavUser } from '@/layout/Sidebar/Nav/NavUser';
import {
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenuButton,
    Sidebar as SidebarPrimitive,
    SidebarRail,
} from '@/layout/Sidebar/primitives/Sidebar';

type SidebarProps = ComponentProps<typeof SidebarPrimitive>;

export const Sidebar = (props: SidebarProps) => (
    <SidebarPrimitive
        collapsible="icon"
        {...props}
    >
        <SidebarHeader>
            <SidebarMenuButton
                asChild
                className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
                <Logo />
            </SidebarMenuButton>
        </SidebarHeader>
        <SidebarContent>
            <NavMain />
            <NavProjects />
        </SidebarContent>
        <SidebarFooter>
            <NavUser />
        </SidebarFooter>
        <SidebarRail />
    </SidebarPrimitive>
);
