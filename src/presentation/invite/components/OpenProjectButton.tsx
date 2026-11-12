'use client';

import { ROUTES } from '@/shared/constants';
import { Button } from '@/ui/Base';
import { useRouter } from 'next/navigation';

export const OpenProjectButton = ({ projectId }: { projectId: string }) => {
    const { push } = useRouter();

    return (
        <Button
            className="w-full"
            onClick={() => push(ROUTES.project(projectId))}
        >
            Открыть проект
        </Button>
    );
};
