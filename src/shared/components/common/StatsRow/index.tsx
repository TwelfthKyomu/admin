import type { ComponentProps, ReactNode } from 'react';
import { StatWidget } from '@/shared/components/common/StatWidget';
import { WidgetGrid } from '@/shared/components/common/WidgetGrid';
import { cn } from '@/shared/lib/utils';

export interface StatItem {
    label: ReactNode;
    value: ReactNode;
    hint?: ReactNode;
    icon?: ComponentProps<typeof StatWidget>['icon'];
    tone?: 'default' | 'destructive';
}

interface StatsRowProps {
    items: StatItem[];
    className?: string;
}

export const StatsRow = ({ items, className }: StatsRowProps) => (
    <WidgetGrid
        columns={Math.min(Math.max(items.length, 1), 6)}
        gap="md"
        className={cn('mb-4', className)}
    >
        {items.map((item, index) => (
            <StatWidget
                key={index}
                {...item}
            />
        ))}
    </WidgetGrid>
);
