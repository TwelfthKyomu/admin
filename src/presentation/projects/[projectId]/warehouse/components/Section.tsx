import type { PropsWithChildren } from 'react';

export const Section = ({ title, children }: PropsWithChildren<{ title: string }>) => (
    <section className="grid grid-cols-1 gap-2">
        <h2 className="font-medium text-sm">{title}</h2>
        {children}
    </section>
);
