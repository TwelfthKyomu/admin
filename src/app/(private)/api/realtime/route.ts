import { getServerSession } from '@/infrastructure/auth/getServerSession';
import { canSeeProject } from '@/shared/api/permission';
import {
    publishScopeEvent,
    type ScopeEvent,
    subscribeToScope,
} from '@/shared/realtime/scopeEvents';
import { findChatChannelById } from '@/contexts/chat/Chat.lib';
import {
    CHAT_SCOPE_PREFIX,
    chatChannelsScope,
    chatScopeKey,
    isChatParticipant,
} from '@/contexts/chat/Chat.types';
import { findOrganizationByUserId } from '@/contexts/organization/Organization.lib';

async function canSubscribe(
    userId: string,
    organizationId: string,
    scopeId: string,
): Promise<boolean> {
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
}

async function authorizeScopes(
    userId: string,
    scopeIds: string[],
): Promise<string[]> {
    const org = await findOrganizationByUserId(userId);

    if (!org) return [];

    const allowed: string[] = [];

    for (const scopeId of scopeIds) {
        if (await canSubscribe(userId, org.id, scopeId)) allowed.push(scopeId);
    }

    return allowed;
}

function serializeEvent(scopeId: string, event: ScopeEvent): string {
    return `event: ${event.type}\ndata: ${JSON.stringify({ ...event, scopeId })}\n\n`;
}

export async function GET(request: Request) {
    const session = await getServerSession();

    if (!session?.user) return new Response('Unauthorized', { status: 401 });

    const requestedScopeIds = new URL(request.url).searchParams
        .getAll('scope')
        .filter(Boolean);

    if (requestedScopeIds.length === 0)
        return new Response('Missing scope', { status: 400 });

    const scopeIds = await authorizeScopes(session.user.id, requestedScopeIds);

    if (scopeIds.length === 0)
        return new Response('Forbidden', { status: 403 });

    const encoder = new TextEncoder();
    const unsubscribers: Array<() => void> = [];
    let heartbeat: ReturnType<typeof setInterval> | undefined;

    const stream = new ReadableStream({
        start(controller) {
            const send = (chunk: string) => {
                try {
                    controller.enqueue(encoder.encode(chunk));
                } catch {}
            };

            send('retry: 3000\n\n');

            for (const scopeId of scopeIds) {
                unsubscribers.push(
                    subscribeToScope(scopeId, (event) =>
                        send(serializeEvent(scopeId, event)),
                    ),
                );
            }

            heartbeat = setInterval(() => send(': ping\n\n'), 25_000);
        },
        cancel() {
            if (heartbeat) clearInterval(heartbeat);

            for (const off of unsubscribers) off();
        },
    });

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',

            'X-Accel-Buffering': 'no',
        },
    });
}

export async function POST(request: Request) {
    const session = await getServerSession();

    if (!session?.user) return new Response('Unauthorized', { status: 401 });

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return new Response('Bad request', { status: 400 });
    }

    const { scopeId, typing, origin } = (body ?? {}) as {
        scopeId?: unknown;
        typing?: unknown;
        origin?: unknown;
    };

    if (typeof scopeId !== 'string' || scopeId.length === 0) {
        return new Response('Bad request', { status: 400 });
    }

    const allowed = await authorizeScopes(session.user.id, [scopeId]);

    if (allowed.length === 0) {
        return new Response('Forbidden', { status: 403 });
    }

    publishScopeEvent(
        scopeId,
        typing === true
            ? {
                  type: 'typing',
                  userId: session.user.id,
                  name: session.user.name,
              }
            : {
                  type: 'sync',
                  origin: typeof origin === 'string' ? origin : undefined,
              },
    );

    return new Response(null, { status: 204 });
}
