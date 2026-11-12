'use client';

import type { InviteStateView } from '@/contexts/projectInvite';
import { AuthTabs } from './components/AuthTabs';
import { CodeForm } from './components/CodeForm';
import { InfoScreen } from './components/InfoScreen';
import { OpenProjectButton } from './components/OpenProjectButton';
import { SwitchAccountButton } from './components/SwitchAccountButton';

interface AcceptInvitePageProps {
    token: string;
    context: InviteStateView;
}

export const AcceptInvitePage = ({ token, context }: AcceptInvitePageProps) => {
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
                    action={<OpenProjectButton projectId={context.projectId} />}
                />
            );

        case 'email_mismatch':
            return (
                <InfoScreen
                    title="Приглашение для другого аккаунта"
                    description={`Приглашение оформлено на ${context.invitedEmail}, а вы вошли как ${context.currentEmail}. Выйдите и войдите нужным аккаунтом.`}
                    action={<SwitchAccountButton token={token} />}
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
