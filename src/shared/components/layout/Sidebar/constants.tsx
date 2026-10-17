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
        label: 'Главная панель',
        href: ROUTES.home,
        icon: <LayoutDashboard />,
    },
    {
        label: 'Чат',
        href: ROUTES.chat,
        icon: <MessagesSquare />,
    },
    {
        label: 'Тариф',
        href: ROUTES.billing,
        icon: <CreditCard />,
        permission: Permission.MANAGE_BILLING,
    },
    {
        label: 'Журнал',
        href: ROUTES.audit,
        icon: <ScrollText />,
        permission: Permission.MANAGE_ORGANIZATION,
    },
    {
        label: 'Пользователи',
        href: ROUTES.users,
        icon: <Users />,
        permission: Permission.MANAGE_MEMBERS,
    },
];
