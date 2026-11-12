'use client';

import { useProject } from '@/app/providers';
import { runAction } from '@/shared/lib/action-result';
import {
    useProjectInvitesList,
    useRevokeProjectInvite,
} from '@/contexts/projectInvite';

export const useInvitePanel = () => {
    const { projectId } = useProject();
    const invites = useProjectInvitesList(projectId).data ?? [];
    const { mutateAsync, isPending } = useRevokeProjectInvite();

    const revoke = (inviteId: string) =>
        runAction(mutateAsync({ id: inviteId, projectId }), {
            success: 'Приглашение отозвано',
        });

    return { invites, isPending, revoke };
};
