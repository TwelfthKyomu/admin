import { Tabs } from '@/ui/Base';
import { AuthShell } from './components/AuthShell';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';

export const AuthPage = () => (
    <AuthShell
        title="Добро пожаловать"
        subtitle="Войдите в админ-панель Flowsy"
    >
        <Tabs
            listClassName="mx-auto w-full"
            triggerClassName="w-full data-active:!bg-card"
            defaultValue="login"
            items={[
                {
                    value: 'login',
                    label: 'Авторизация',
                    content: <LoginForm />,
                },
                {
                    value: 'register',
                    label: 'Регистрация',
                    content: <RegisterForm />,
                },
            ]}
        />
    </AuthShell>
);
