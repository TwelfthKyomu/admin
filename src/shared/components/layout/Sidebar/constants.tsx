import type { ReactNode } from 'react';
import { ROUTES } from '@/shared/constants';
import { Permission } from '@/contexts/user/User.types';
import { CreditCard, LayoutDashboard, MessagesSquare, ScrollText, Users } from 'lucide-react';

interface NavItem {
    label: string;
    href: string;
    icon: ReactNode;
    permission?: Permission;
}

export const navMain: NavItem[] = [
    {
        label: 'main',
        href: ROUTES.home,
        icon: <LayoutDashboard />,
    },
    {
        label: 'chat',
        href: ROUTES.chat,
        icon: <MessagesSquare />,
    },
    {
        label: 'billing',
        href: ROUTES.billing,
        icon: <CreditCard />,
        permission: Permission.MANAGE_BILLING,
    },
    {
        label: 'audit',
        href: ROUTES.audit,
        icon: <ScrollText />,
        permission: Permission.MANAGE_ORGANIZATION,
    },
    {
        label: 'users',
        href: ROUTES.users,
        icon: <Users />,
        permission: Permission.MANAGE_MEMBERS,
    },
];
