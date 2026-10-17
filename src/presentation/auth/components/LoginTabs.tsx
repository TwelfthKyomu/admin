'use client';

import { CALLBACK_URL_PARAM, safeCallbackPath } from '@/shared/constants/auth';
import { Tabs } from '@/ui/Base';
import { useSearchParams } from 'next/navigation';
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

export const CallbackLoginTabs = () => {
    const searchParams = useSearchParams();

    return <LoginTabs redirectTo={safeCallbackPath(searchParams.get(CALLBACK_URL_PARAM))} />;
};
