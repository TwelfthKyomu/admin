import type { PropsWithChildren } from 'react';
import { Card } from '@/ui/Base';

export const Shell = ({ children }: PropsWithChildren) => (
    <div className="mx-auto flex min-h-[60vh] max-w-md items-center px-4">
        <Card className="w-full p-6 text-center">{children}</Card>
    </div>
);
