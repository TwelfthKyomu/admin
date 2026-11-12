'use client';

import { Tabs } from '@/ui/Base';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';

interface LoginTabsProps {
    redirectTo: string;
}

export const LoginTabs = ({ redirectTo }: LoginTabsProps) => (
    <Tabs
        listClassName="mx-auto w-full"
        triggerClassName="w-full data-active:!bg-card"
        defaultValue="login"
        items={[
            {
                value: 'login',
                label: 'Авторизация',
                content: <LoginForm redirectTo={redirectTo} />,
            },
            {
                value: 'register',
                label: 'Регистрация',
                content: <RegisterForm redirectTo={redirectTo} />,
            },
        ]}
    />
);
