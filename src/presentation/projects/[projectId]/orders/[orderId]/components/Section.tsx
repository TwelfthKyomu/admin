import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface SectionProps {
    title: string;
    aside?: ReactNode;
    className?: string;
    children?: ReactNode;
}

export const Section = ({ title, aside, className, children }: SectionProps) => (
    <section className={cn('rounded-lg border border-border bg-background', className)}>
        <header className="flex h-10 items-center justify-between gap-2 border-b border-border px-4">
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">
                {title}
            </span>
            {aside}
        </header>
        {children}
    </section>
);
