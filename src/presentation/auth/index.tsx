import { Suspense } from 'react';
import { AuthShell } from './components/AuthShell';
import { CallbackLoginTabs } from './components/CallbackLoginTabs';
import { LoginTabs } from './components/LoginTabs';

export const AuthPage = () => (
    <AuthShell
        title="Добро пожаловать"
        subtitle="Войдите в админ-панель Flowsy"
    >
        <Suspense fallback={<LoginTabs redirectTo="/" />}>
            <CallbackLoginTabs />
        </Suspense>
    </AuthShell>
);
