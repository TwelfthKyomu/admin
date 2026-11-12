'use client';

import { useState } from 'react';
import { ROUTES } from '@/shared/constants';
import { runAction } from '@/shared/lib/action-result';
import { useAcceptProjectInvite } from '@/contexts/projectInvite';
import { useRouter } from 'next/navigation';
import { acceptButtonLabel, CODE_LENGTH } from '../lib/code';

export const useCodeForm = (token: string) => {
    const router = useRouter();
    const accept = useAcceptProjectInvite();
    const [code, setCode] = useState('');
    const [done, setDone] = useState(false);

    const onAccept = async () => {
        const { success, response } = await runAction(
            accept.mutateAsync({ token, code }),
            {
                success: 'Вы присоединились к проекту',
            },
        );

        if (!success) return;

        setDone(true);
        const projectId = response?.data?.projectId;

        if (projectId) router.push(ROUTES.project(projectId));
    };

    return {
        code,
        setCode,
        onAccept,
        locked: accept.isPending || done,
        ready: code.length === CODE_LENGTH && !accept.isPending && !done,
        buttonLabel: acceptButtonLabel(accept.isPending, done),
    };
};
