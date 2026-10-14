import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
    title: ReactNode;
    description?: ReactNode;
    icon?: ComponentType<{ className?: string }>;
    action?: ReactNode;
    destructive?: boolean;
    className?: string;
}

export const EmptyState = ({
    title,
    description,
    icon: Icon = Inbox,
    action,
    destructive,
    className,
}: EmptyStateProps) => (
    <div
        className={cn(
            'flex flex-col items-center justify-center gap-4 px-6 py-12 text-center',
            className,
        )}
    >
        <div
            className={cn(
                'flex size-12 items-center justify-center rounded-full',
                destructive
                    ? 'bg-destructive/10 text-destructive'
                    : 'bg-muted text-muted-foreground',
            )}
        >
            <Icon className="size-6" />
        </div>
        <div className="space-y-1.5">
            <p className="text-base font-medium">{title}</p>
            {description && (
                <p className="mx-auto max-w-sm text-muted-foreground text-sm">{description}</p>
            )}
        </div>
        {action}
    </div>
);
