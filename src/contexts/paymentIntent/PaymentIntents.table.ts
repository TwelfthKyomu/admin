import { positive } from '@/infrastructure/database/checks';
import { createdAt, id } from '@/infrastructure/database/columns';
import {
    currencyEnum,
    paymentIntentStatusEnum,
} from '@/infrastructure/database/schemas/enums';
import { projectIntegrations } from '@/contexts/integration/Integrations.table';
import { orders } from '@/contexts/order/Orders.table';
import { projects } from '@/contexts/project/Projects.table';
import { isNotNull } from 'drizzle-orm';
import {
    bigint,
    check,
    foreignKey,
    index,
    jsonb,
    pgTable,
    text,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';
import type { PaymentProvider } from './PaymentIntent.types';

export const paymentIntents = pgTable(
    'payment_intents',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        integrationId: text('integration_id').notNull(),
        providerPaymentId: varchar('provider_payment_id', { length: 128 }),
        orderId: text('order_id').notNull(),

        amount: bigint('amount', { mode: 'number' }).notNull(),
        currency: currencyEnum('currency').notNull(),
        status: paymentIntentStatusEnum('status').notNull().default('pending'),

        confirmationUrl: text('confirmation_url'),
        idempotenceKey: varchar('idempotence_key', { length: 128 })
            .notNull()
            .$defaultFn(() => crypto.randomUUID()),
        metadata: jsonb('metadata')
            .$type<Record<string, unknown>>()
            .notNull()
            .default({}),

        createdAt,
    },
    (t) => [
        foreignKey({
            columns: [t.orderId, t.projectId],
            foreignColumns: [orders.id, orders.projectId],
            name: 'payment_intents_order_project_fk',
        }).onDelete('cascade'),
        foreignKey({
            columns: [t.integrationId, t.projectId],
            foreignColumns: [
                projectIntegrations.id,
                projectIntegrations.projectId,
            ],
            name: 'payment_intents_integration_project_fk',
        }),

        check('payment_intents_amount_positive', positive(t.amount)),

        uniqueIndex('payment_intents_integration_provider_payment_unique')
            .on(t.integrationId, t.providerPaymentId)
            .where(isNotNull(t.providerPaymentId)),
        uniqueIndex('payment_intents_integration_idempotence_unique').on(
            t.integrationId,
            t.idempotenceKey,
        ),

        index('payment_intents_order_idx').on(t.orderId),
        index('payment_intents_project_created_idx').on(
            t.projectId,
            t.createdAt,
        ),
        index('payment_intents_status_idx').on(t.status),
    ],
);

export type PaymentIntentRecord = typeof paymentIntents.$inferSelect;
export type NewPaymentIntentRecord = typeof paymentIntents.$inferInsert;

export type PaymentIntentView = Pick<
    PaymentIntentRecord,
    | 'id'
    | 'orderId'
    | 'amount'
    | 'currency'
    | 'status'
    | 'confirmationUrl'
    | 'createdAt'
> & {
    provider: PaymentProvider;
    applyError: string | null;
    refundedAt: Date | null;
};
