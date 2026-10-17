import { BEARER_PREFIX, HTTP } from '@/shared/constants/http';
import { sendDueReminders } from '@/contexts/order/OrderReminder.lib';
import { env } from '@/env';
import { constantTimeEqual } from 'better-auth/crypto';
import { connection } from 'next/server';

function isAuthorized(request: Request): boolean {
    const header = request.headers.get('authorization') ?? '';

    return Boolean(
        env.CRON_SECRET &&
            header.startsWith(BEARER_PREFIX) &&
            constantTimeEqual(
                header.slice(BEARER_PREFIX.length),
                env.CRON_SECRET,
            ),
    );
}

export async function POST(request: Request) {
    await connection();

    if (!isAuthorized(request)) {
        return new Response('Not found', { status: HTTP.NOT_FOUND });
    }

    return Response.json({ sent: await sendDueReminders() });
}
