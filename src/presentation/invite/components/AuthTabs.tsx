'use client';

import { ROUTES } from '@/shared/constants';
import type { InviteView } from '@/contexts/projectInvite';
import { LoginForm } from '@/presentation/auth/components/LoginForm';
import { RegisterForm } from '@/presentation/auth/components/RegisterForm';
import { Tabs } from '@/ui/Base';
import { PreviewHeader } from './PreviewHeader';
import { Shell } from './Shell';

interface AuthTabsProps {
    token: string;
    preview: InviteView;
    invitedEmail?: string;
}

export const AuthTabs = ({ token, preview, invitedEmail }: AuthTabsProps) => {
    const inviteUrl = ROUTES.invite(token);
    const email = invitedEmail ?? undefined;

    return (
        <Shell>
            <PreviewHeader preview={preview} />
            <p className="mt-2 mb-5 text-sm text-muted-foreground">
                Создайте аккаунт или войдите, чтобы присоединиться.
            </p>
            <Tabs
                listClassName="mx-auto w-full"
                triggerClassName="w-full data-active:!bg-card"
                defaultValue="register"
                items={[
                    {
                        value: 'register',
                        label: 'Регистрация',
                        content: (
                            <RegisterForm
                                redirectTo={inviteUrl}
                                defaultEmail={email}
                            />
                        ),
                    },
                    {
                        value: 'login',
                        label: 'Вход',
                        content: (
                            <LoginForm
                                redirectTo={inviteUrl}
                                defaultEmail={email}
                            />
                        ),
                    },
                ]}
            />
        </Shell>
    );
};
