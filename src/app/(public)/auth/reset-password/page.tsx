import { Suspense } from 'react';
import { AuthShell } from '@/presentation/auth/components/AuthShell';
import { ResetPasswordPage } from '@/presentation/auth/reset-password';
import { Spinner } from '@/ui/Base';

const ResetPassword = () => (
    <AuthShell
        title="Новый пароль"
        subtitle="Придумайте новый пароль для входа"
    >
        <Suspense
            fallback={
                <div className="flex justify-center py-6">
                    <Spinner />
                </div>
            }
        >
            <ResetPasswordPage />
        </Suspense>
    </AuthShell>
);

export default ResetPassword;
