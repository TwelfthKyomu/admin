import type { ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/ui/Base';

interface EditorCardProps {
    title: string;
    description?: string;
    children: ReactNode;
}

export const EditorCard = ({ title, description, children }: EditorCardProps) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
        </CardHeader>
        <CardContent className="grid gap-4">{children}</CardContent>
    </Card>
);
