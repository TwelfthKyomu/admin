import 'server-only';

import { canSeeProject } from '@/shared/api/permission';
import { findChatChannelById } from '@/contexts/chat/Chat.lib';
import {
    CHAT_SCOPE_PREFIX,
    chatChannelsScope,
    chatScopeKey,
    isChatParticipant,
} from '@/contexts/chat/Chat.types';
import { findOrganizationByUserId } from '@/contexts/organization/Organization.lib';

const canSubscribe = async (
    userId: string,
    organizationId: string,
    scopeId: string,
): Promise<boolean> => {
    if (scopeId === chatChannelsScope(organizationId)) return true;
    if (scopeId === chatScopeKey(organizationId, { kind: 'organization' })) {
        return true;
    }

    if (scopeId.startsWith(CHAT_SCOPE_PREFIX.direct)) {
        const channel = await findChatChannelById(
            scopeId.slice(CHAT_SCOPE_PREFIX.direct.length),
        );

        return (
            channel !== null &&
            channel.organizationId === organizationId &&
            isChatParticipant(channel, userId)
        );
    }

    if (scopeId.startsWith(CHAT_SCOPE_PREFIX.project)) {
        return canSeeProject(
            userId,
            scopeId.slice(CHAT_SCOPE_PREFIX.project.length),
        );
    }

    return canSeeProject(userId, scopeId);
};

export const authorizeScopes = async (
    userId: string,
    scopeIds: string[],
): Promise<string[]> => {
    const org = await findOrganizationByUserId(userId);

    if (!org) return [];

    const allowed: string[] = [];

    for (const scopeId of scopeIds) {
        if (await canSubscribe(userId, org.id, scopeId)) allowed.push(scopeId);
    }

    return allowed;
};
