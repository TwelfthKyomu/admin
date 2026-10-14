'use client';

import { useStaticData } from '@/app/providers';
import { useActiveUrl } from '@/shared/hooks/useActiveUrl';
import { canInOrg } from '@/contexts/organizationMember/OrganizationMember.types';
import { navMain } from '@/layout/Sidebar/constants';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '../primitives/Sidebar';

export const NavMain = () => {
    const { organization } = useStaticData();

    const visible = navMain.filter(
        (item) => !item.permission || canInOrg(organization.role, item.permission),
    );

    const t = useTranslations('menu');
    const isActive = useActiveUrl();

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Меню</SidebarGroupLabel>
            <SidebarMenu>
                {visible.map(({ label, href, icon }) => (
                    <SidebarMenuItem key={href}>
                        <SidebarMenuButton
                            asChild
                            tooltip={t(label)}
                            isActive={isActive(href)}
                        >
                            <Link href={href}>
                                {icon}
                                <span>{t(label)}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
};
