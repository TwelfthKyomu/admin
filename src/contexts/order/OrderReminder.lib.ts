import 'server-only';

import { db } from '@/infrastructure/database/client';
import { addHours } from 'date-fns';
import { and, asc, between, eq, inArray, isNotNull, isNull } from 'drizzle-orm';
import { OrderStatus } from './Order.types';
import { mailOrderReminder } from './OrderMail.lib';
import { orders } from './Orders.table';

export const REMINDER_LEAD_HOURS = 24;

const REMINDER_BATCH_SIZE = 100;

const REMINDABLE_STATUSES = [OrderStatus.PENDING, OrderStatus.CONFIRMED];

export async function sendDueReminders(now = new Date()): Promise<number> {
    const due = await db
        .select({ id: orders.id })
        .from(orders)
        .where(
            and(
                inArray(orders.status, REMINDABLE_STATUSES),
                isNull(orders.reminderSentAt),
                isNotNull(orders.customerEmail),
                between(
                    orders.scheduledAt,
                    now,
                    addHours(now, REMINDER_LEAD_HOURS),
                ),
            ),
        )
        .orderBy(asc(orders.scheduledAt))
        .limit(REMINDER_BATCH_SIZE);

    let sent = 0;

    for (const { id } of due) {
        const [claimed] = await db
            .update(orders)
            .set({ reminderSentAt: now })
            .where(and(eq(orders.id, id), isNull(orders.reminderSentAt)))
            .returning({ id: orders.id });

        if (!claimed) continue;

        await mailOrderReminder(id);
        sent += 1;
    }

    return sent;
}
