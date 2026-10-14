import type { ReactNode } from 'react';
import { Shell } from './Shell';

interface InfoScreenProps {
    title: string;
    description: string;
    action?: ReactNode;
}

export const InfoScreen = ({ title, description, action }: InfoScreenProps) => (
    <Shell>
        <h1 className="text-lg font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        {action ? <div className="mt-5">{action}</div> : null}
    </Shell>
);
