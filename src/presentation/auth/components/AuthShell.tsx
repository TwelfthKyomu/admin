import type { ReactNode } from 'react';
import { ROUTES } from '@/shared/constants';
import { Icon } from '@/layout/Sidebar/Logo/Icon';
import { Card } from '@/ui/Base';
import Link from 'next/link';

interface AuthShellProps {
    title: string;
    subtitle: string;
    children: ReactNode;
}

export const AuthShell = ({ title, subtitle, children }: AuthShellProps) => (
    <div className="flex min-h-dvh items-center justify-center p-4 sm:p-12">
        <div className="flex w-full max-w-sm flex-col gap-5">
            <div className="flex flex-col items-center gap-3 text-center">
                <Icon />
                <h1 className="text-2xl font-extrabold">{title}</h1>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>
            <Card className="w-full p-4">{children}</Card>
            <p className="text-center text-xs text-muted-foreground">
                Демо-версия: используйте только тестовые данные.{' '}
                <Link
                    href={ROUTES.terms}
                    className="underline underline-offset-2"
                >
                    Условия использования
                </Link>
            </p>
        </div>
    </div>
);
