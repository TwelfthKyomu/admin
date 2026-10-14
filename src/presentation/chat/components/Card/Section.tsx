import type { ReactNode } from 'react';

interface CardSectionProps {
    title: string;
    count?: number;
    children: ReactNode;
}

export const CardSection = ({ title, count, children }: CardSectionProps) => (
    <section className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2 px-0.5">
            <span className="text-[10px] leading-[1.2] font-medium tracking-[0.05em] text-muted-foreground uppercase">
                {title}
            </span>
            <span className="flex-1" />
            {count !== undefined && (
                <span className="font-mono text-[11px] leading-none text-muted-foreground">
                    {count}
                </span>
            )}
        </div>
        {children}
    </section>
);
