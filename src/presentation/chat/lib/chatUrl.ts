import type { ChatTarget } from '@/contexts/chat';

export const ORGANIZATION_CHANNEL_PARAM = 'org';

const PROJECT_PREFIX = 'project:';
const DIRECT_PREFIX = 'dm:';
const THREAD = 'thread';
const THREAD_PREFIX = `${THREAD}:`;
const CARD = 'card';
const CARD_PREFIX = `${CARD}:`;

function idAfter(raw: string, prefix: string): string | undefined {
    if (!raw.startsWith(prefix)) return undefined;

    const id = raw.slice(prefix.length).trim();

    return id.length > 0 ? id : undefined;
}

export function serializeChatTarget(target: ChatTarget): string {
    if (target.kind === 'project')
        return `${PROJECT_PREFIX}${target.projectId}`;
    if (target.kind === 'direct') return `${DIRECT_PREFIX}${target.channelId}`;

    return ORGANIZATION_CHANNEL_PARAM;
}

export function parseChatTarget(raw: string): ChatTarget {
    const projectId = idAfter(raw, PROJECT_PREFIX);

    if (projectId) return { kind: 'project', projectId };

    const channelId = idAfter(raw, DIRECT_PREFIX);

    if (channelId) return { kind: 'direct', channelId };

    return { kind: 'organization' };
}

export type ChatPanel =
    | { kind: 'card'; userId?: string }
    | { kind: 'thread'; messageId?: string };

export function serializeChatPanel(panel?: ChatPanel): string {
    if (!panel) return '';

    const id = panel.kind === 'card' ? panel.userId : panel.messageId;

    return id ? `${panel.kind}:${id}` : panel.kind;
}

export function parseChatPanel(raw: string): ChatPanel | undefined {
    const messageId = idAfter(raw, THREAD_PREFIX);

    if (messageId || raw === THREAD) return { kind: 'thread', messageId };

    const userId = idAfter(raw, CARD_PREFIX);

    if (userId || raw === CARD) return { kind: 'card', userId };

    return undefined;
}
