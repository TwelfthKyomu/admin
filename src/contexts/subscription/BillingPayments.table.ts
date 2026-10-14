import { positive } from '@/infrastructure/database/checks';
import { createdAt, id } from '@/infrastructure/database/columns';
import {
    billingPaymentStatusEnum,
    currencyEnum,
    subscriptionPlanEnum,
} from '@/infrastructure/database/schemas/enums';
import { organizations } from '@/contexts/organization/Organizations.table';
import { users } from '@/contexts/user/Users.table';
import { sql } from 'drizzle-orm';
import {
    bigint,
    check,
    index,
    integer,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';
import { BillingPaymentStatus } from './Subscription.types';

export const billingPayments = pgTable(
    'billing_payments',
    {
        id,
        organizationId: text('organization_id')
            .notNull()
            .references(() => organizations.id, { onDelete: 'cascade' }),
        plan: subscriptionPlanEnum('plan').notNull(),
        amount: bigint('amount', { mode: 'number' }).notNull(),
        periodDays: integer('period_days').notNull().default(30),
        currency: currencyEnum('currency').notNull(),
        status: billingPaymentStatusEnum('status')
            .notNull()
            .default(BillingPaymentStatus.PENDING),
        providerSessionId: varchar('provider_session_id', {
            length: 255,
        }).notNull(),
        createdBy: text('created_by').references(() => users.id, {
            onDelete: 'set null',
        }),
        paidAt: timestamp('paid_at'),
        periodEnd: timestamp('period_end'),
        createdAt,
    },
    (t) => [
        uniqueIndex('billing_payments_provider_session_unique').on(
            t.providerSessionId,
        ),
        index('billing_payments_organization_idx').on(
            t.organizationId,
            t.createdAt,
        ),
        check('billing_payments_amount_positive', positive(t.amount)),
        check(
            'billing_payments_paid_shape',
            sql`(${t.status} = 'paid') = (${t.paidAt} is not null and ${t.periodEnd} is not null)`,
        ),
    ],
);

export type BillingPaymentRecord = typeof billingPayments.$inferSelect;
