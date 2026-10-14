import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface PageHeaderProps {
    title: ReactNode;
    description?: ReactNode;
    badge?: ReactNode;
    actions?: ReactNode;
    className?: string;
}

export const PageHeader = ({ title, description, badge, actions, className }: PageHeaderProps) => (
    <header className={cn('mb-4 flex flex-wrap items-start justify-between gap-3', className)}>
        <div className="grid min-w-0 gap-1">
            <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                {badge}
            </div>
            {description && <p className="text-[13px] text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
);
