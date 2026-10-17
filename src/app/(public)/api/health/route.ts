import { db } from '@/infrastructure/database/client';
import { HTTP } from '@/shared/constants/http';
import { sql } from 'drizzle-orm';
import { connection } from 'next/server';

export async function GET() {
    await connection();

    try {
        await db.execute(sql`select 1`);

        return Response.json({ status: 'ok' });
    } catch {
        return Response.json(
            { status: 'degraded', database: 'unavailable' },
            { status: HTTP.SERVICE_UNAVAILABLE },
        );
    }
}
