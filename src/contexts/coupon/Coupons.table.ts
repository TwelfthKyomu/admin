import {
    nonNegative,
    nullOrNonNegative,
    nullOrPositive,
    positive,
} from '@/infrastructure/database/checks';
import { createdAt, deletedAt, id } from '@/infrastructure/database/columns';
import {
    couponDiscountTypeEnum,
    couponStatusEnum,
} from '@/infrastructure/database/schemas/enums';
import { clients } from '@/contexts/client/Clients.table';
import { orders } from '@/contexts/order/Orders.table';
import { projects } from '@/contexts/project/Projects.table';
import { isNull, sql } from 'drizzle-orm';
import {
    bigint,
    check,
    foreignKey,
    index,
    integer,
    jsonb,
    pgTable,
    text,
    timestamp,
    unique,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';
import type { CouponScope } from './Coupon.types';

export const coupons = pgTable(
    'coupons',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),

        code: varchar('code', { length: 32 }).notNull(),
        label: varchar('label', { length: 255 }).notNull(),

        discountType: couponDiscountTypeEnum('discount_type').notNull(),

        discountValue: bigint('discount_value', { mode: 'number' }).notNull(),

        scope: jsonb('scope')
            .$type<CouponScope>()
            .notNull()
            .default({ rules: [] }),

        status: couponStatusEnum('status').notNull().default('active'),

        validFrom: timestamp('valid_from'),
        validUntil: timestamp('valid_until'),
        maxUses: integer('max_uses'),
        usesCount: integer('uses_count').notNull().default(0),
        maxUsesPerClient: integer('max_uses_per_client'),
        minOrderAmount: bigint('min_order_amount', { mode: 'number' }),

        deletedAt,
        createdAt,
    },
    (t) => [
        unique('coupons_id_project_unique').on(t.id, t.projectId),

        uniqueIndex('coupons_project_code_unique')
            .on(t.projectId, t.code)
            .where(isNull(t.deletedAt)),
        index('coupons_project_idx').on(t.projectId),
        index('coupons_status_idx').on(t.status),

        check('coupons_discount_value_positive', positive(t.discountValue)),
        check(
            'coupons_percentage_in_range',
            sql`${t.discountType} <> 'percentage' or ${t.discountValue} <= 100`,
        ),
        check('coupons_max_uses_positive', nullOrPositive(t.maxUses)),
        check(
            'coupons_max_uses_per_client_positive',
            nullOrPositive(t.maxUsesPerClient),
        ),
        check(
            'coupons_min_order_non_negative',
            nullOrNonNegative(t.minOrderAmount),
        ),
        check('coupons_uses_count_non_negative', nonNegative(t.usesCount)),
        check(
            'coupons_valid_range',
            sql`${t.validFrom} is null or ${t.validUntil} is null or ${t.validFrom} <= ${t.validUntil}`,
        ),
    ],
);

export type CouponRecord = typeof coupons.$inferSelect;
export type NewCouponRecord = typeof coupons.$inferInsert;

export type CouponView = CouponRecord;

export const couponRedemptions = pgTable(
    'coupon_redemptions',
    {
        id,
        couponId: text('coupon_id')
            .notNull()
            .references(() => coupons.id, { onDelete: 'cascade' }),
        orderId: text('order_id')
            .notNull()
            .references(() => orders.id, { onDelete: 'cascade' }),
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        clientId: text('client_id').references(() => clients.id, {
            onDelete: 'set null',
        }),
        amount: bigint('amount', { mode: 'number' }).notNull(),
    },
    (t) => [
        foreignKey({
            columns: [t.couponId, t.projectId],
            foreignColumns: [coupons.id, coupons.projectId],
            name: 'coupon_redemptions_coupon_project_fk',
        }),
        foreignKey({
            columns: [t.orderId, t.projectId],
            foreignColumns: [orders.id, orders.projectId],
            name: 'coupon_redemptions_order_project_fk',
        }),
        foreignKey({
            columns: [t.clientId, t.projectId],
            foreignColumns: [clients.id, clients.projectId],
            name: 'coupon_redemptions_client_project_fk',
        }),

        uniqueIndex('coupon_redemptions_coupon_order_unique').on(
            t.couponId,
            t.orderId,
        ),
        index('coupon_redemptions_coupon_client_idx').on(
            t.couponId,
            t.clientId,
        ),
        check('coupon_redemptions_amount_non_negative', nonNegative(t.amount)),
    ],
);

export type CouponRedemptionRecord = typeof couponRedemptions.$inferSelect;
export type NewCouponRedemptionRecord = typeof couponRedemptions.$inferInsert;
