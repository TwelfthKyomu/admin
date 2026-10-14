import type { ComponentType, ReactNode } from 'react';
import { Widget, WidgetHeader } from '@/shared/components/common/Widget';
import { cn } from '@/shared/lib/utils';

interface StatWidgetProps {
    label: ReactNode;
    value: ReactNode;
    hint?: ReactNode;
    icon?: ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
    tone?: 'default' | 'destructive';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    className?: string;
}

export const StatWidget = ({
    label,
    value,
    hint,
    icon: Icon,
    tone = 'default',
    size = 'sm',
    className,
}: StatWidgetProps) => (
    <Widget
        size={size}
        className={cn('justify-between gap-1.5', className)}
    >
        <WidgetHeader
            icon={
                Icon && (
                    <Icon
                        aria-hidden
                        className="size-3.5"
                    />
                )
            }
        >
            {label}
        </WidgetHeader>

        <div className="mt-auto flex flex-col gap-0.5">
            <span
                className={cn(
                    'truncate font-semibold text-lg leading-tight tabular-nums',
                    tone === 'destructive' && 'text-destructive',
                )}
            >
                {value}
            </span>
            {hint && (
                <span className="line-clamp-2 text-[10px] text-muted-foreground leading-snug">
                    {hint}
                </span>
            )}
        </div>
    </Widget>
);
