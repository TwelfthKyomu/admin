'use client';

import { ROUTES } from '@/shared/constants';
import { signOut } from '@/shared/lib/auth-client';
import type { InviteStateView } from '@/contexts/projectInvite';
import { Button } from '@/ui/Base';
import { useRouter } from 'next/navigation';
import { AuthTabs } from './components/AuthTabs';
import { CodeForm } from './components/CodeForm';
import { InfoScreen } from './components/InfoScreen';

interface AcceptInvitePageProps {
    token: string;
    context: InviteStateView;
}

export const AcceptInvitePage = ({ token, context }: AcceptInvitePageProps) => {
    const { push } = useRouter();

    const projectAction = (projectId: string) => (
        <Button
            className="w-full"
            onClick={() => push(ROUTES.project(projectId))}
        >
            Открыть проект
        </Button>
    );

    switch (context.state) {
        case 'ready':
            return (
                <CodeForm
                    token={token}
                    preview={context.preview}
                />
            );

        case 'needs_auth':
            return (
                <AuthTabs
                    token={token}
                    preview={context.preview}
                    invitedEmail={context.invitedEmail ?? undefined}
                />
            );

        case 'already_member':
            return (
                <InfoScreen
                    title="Вы уже состоите в этом проекте"
                    description="Повторно принимать приглашение не нужно."
                    action={projectAction(context.projectId)}
                />
            );

        case 'email_mismatch':
            return (
                <InfoScreen
                    title="Приглашение для другого аккаунта"
                    description={`Приглашение оформлено на ${context.invitedEmail}, а вы вошли как ${context.currentEmail}. Выйдите и войдите нужным аккаунтом.`}
                    action={
                        <Button
                            className="w-full"
                            variant="outline"
                            onClick={async () => {
                                await signOut();

                                push(
                                    `${ROUTES.auth}?callbackUrl=${encodeURIComponent(ROUTES.invite(token))}`,
                                );
                            }}
                        >
                            Выйти и сменить аккаунт
                        </Button>
                    }
                />
            );

        case 'other_org':
            return (
                <InfoScreen
                    title="Вы уже состоите в другой организации"
                    description={`${
                        context.currentOrgName
                            ? `Ваша организация: «${context.currentOrgName}». `
                            : ''
                    }Один пользователь может состоять только в одной организации.`}
                />
            );

        case 'revoked':
            return (
                <InfoScreen
                    title="Приглашение отозвано"
                    description="Эта ссылка больше не действительна. Попросите новое приглашение."
                />
            );

        case 'expired':
            return (
                <InfoScreen
                    title="Срок приглашения истёк"
                    description="Ссылка действует ограниченное время. Попросите новое приглашение."
                />
            );

        case 'used':
            return (
                <InfoScreen
                    title="Приглашение уже использовано"
                    description="Этой ссылкой уже воспользовались. Попросите новое приглашение."
                />
            );

        default:
            return (
                <InfoScreen
                    title="Ссылка недействительна"
                    description="Приглашение не найдено или ссылка повреждена."
                />
            );
    }
};
