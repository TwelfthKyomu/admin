import { getServerSession } from '@/infrastructure/auth/getServerSession';
import { authorizeScopes } from '@/shared/realtime/scopeAccess';
import { publishScopeEvent } from '@/shared/realtime/scopeEvents';
import { createScopeStream } from '@/shared/realtime/scopeStream';
import { enforceRateLimit } from '@/shared/security/rate-limit';

const MAX_SCOPES = 32;

export const GET = async (request: Request) => {
    const session = await getServerSession();

    if (!session?.user) return new Response('Unauthorized', { status: 401 });

    const requestedScopeIds = [
        ...new Set(new URL(request.url).searchParams.getAll('scope')),
    ].filter(Boolean);

    if (requestedScopeIds.length === 0 || requestedScopeIds.length > MAX_SCOPES)
        return new Response('Bad scope', { status: 400 });

    const scopeIds = await authorizeScopes(session.user.id, requestedScopeIds);

    if (scopeIds.length === 0)
        return new Response('Forbidden', { status: 403 });

    const stream = createScopeStream(scopeIds, request.signal);

    return new Response(stream, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache, no-transform',
            Connection: 'keep-alive',

            'X-Accel-Buffering': 'no',
        },
    });
};

export const POST = async (request: Request) => {
    const session = await getServerSession();

    if (!session?.user) return new Response('Unauthorized', { status: 401 });

    try {
        enforceRateLimit('realtime', session.user.id);
    } catch {
        return new Response('Too many requests', { status: 429 });
    }

    let body: unknown;

    try {
        body = await request.json();
    } catch {
        return new Response('Bad request', { status: 400 });
    }

    const { scopeId } = (body ?? {}) as { scopeId?: unknown };

    if (typeof scopeId !== 'string' || scopeId.length === 0) {
        return new Response('Bad request', { status: 400 });
    }

    const allowed = await authorizeScopes(session.user.id, [scopeId]);

    if (allowed.length === 0) {
        return new Response('Forbidden', { status: 403 });
    }

    publishScopeEvent(scopeId, {
        type: 'typing',
        userId: session.user.id,
        name: session.user.name,
    });

    return new Response(null, { status: 204 });
};
