'use server';

import { db } from '@/infrastructure/database/client';
import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import {
    assertUniqueInProject,
    findInProject,
    insertOne,
    softDeleteInProject,
    updateOne,
} from '@/shared/api/repository';
import { lockOrder } from '@/contexts/order/Order.lib';
import { Permission } from '@/contexts/user/User.types';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { assertScopeInProject, redeemCoupon } from './Coupon.lib';
import {
    CouponsActionInputSchema,
    CreateCouponActionInputSchema,
    DeleteCouponActionInputSchema,
    RedeemCouponActionInputSchema,
    UpdateCouponActionInputSchema,
} from './Coupon.schema';
import {
    assertDiscountValue,
    assertValidRange,
    normalizeCouponCode,
} from './Coupon.types';
import { type CouponRecord, coupons } from './Coupons.table';

function findCouponInProject(
    id: string,
    projectId: string,
): Promise<CouponRecord> {
    return findInProject(coupons, id, projectId, 'Купон не найден');
}

function assertCouponCodeFree(
    projectId: string,
    code: string,
    exceptId?: string,
) {
    return assertUniqueInProject({
        table: coupons,
        column: coupons.code,
        value: code,
        projectId,
        excludeId: exceptId,
        conflict: `Купон с кодом «${code}» уже существует`,
    });
}

export const couponsAction = projectReadAction(Permission.MANAGE_CATALOG)
    .inputSchema(CouponsActionInputSchema)
    .action(({ parsedInput: { projectId } }) =>
        db
            .select()
            .from(coupons)
            .where(
                and(
                    eq(coupons.projectId, projectId),
                    isNull(coupons.deletedAt),
                ),
            )
            .orderBy(desc(coupons.createdAt)),
    );

export const createCouponAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(CreateCouponActionInputSchema)
    .action(async ({ parsedInput }) => {
        const code = normalizeCouponCode(parsedInput.code);

        assertDiscountValue(
            parsedInput.discountType,
            parsedInput.discountValue,
        );

        assertValidRange(
            parsedInput.validFrom ?? null,
            parsedInput.validUntil ?? null,
        );

        await Promise.all([
            assertCouponCodeFree(parsedInput.projectId, code),
            assertScopeInProject(parsedInput.projectId, parsedInput.scope),
        ]);

        return insertOne(
            coupons,
            {
                projectId: parsedInput.projectId,
                code,
                label: parsedInput.label.trim(),
                discountType: parsedInput.discountType,
                discountValue: parsedInput.discountValue,
                scope: parsedInput.scope ?? { rules: [] },
                status: parsedInput.status,
                validFrom: parsedInput.validFrom ?? null,
                validUntil: parsedInput.validUntil ?? null,
                maxUses: parsedInput.maxUses ?? null,
                maxUsesPerClient: parsedInput.maxUsesPerClient ?? null,
                minOrderAmount: parsedInput.minOrderAmount ?? null,
            },
            'Не удалось создать купон',
        );
    });

export const updateCouponAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(UpdateCouponActionInputSchema)
    .action(async ({ parsedInput }) => {
        const coupon = await findCouponInProject(
            parsedInput.id,
            parsedInput.projectId,
        );

        const code =
            parsedInput.code !== undefined
                ? normalizeCouponCode(parsedInput.code)
                : undefined;

        assertDiscountValue(
            parsedInput.discountType ?? coupon.discountType,
            parsedInput.discountValue ?? coupon.discountValue,
        );

        assertValidRange(
            parsedInput.validFrom !== undefined
                ? parsedInput.validFrom
                : coupon.validFrom,
            parsedInput.validUntil !== undefined
                ? parsedInput.validUntil
                : coupon.validUntil,
        );

        await Promise.all([
            code !== undefined && code !== coupon.code
                ? assertCouponCodeFree(coupon.projectId, code, coupon.id)
                : undefined,
            assertScopeInProject(coupon.projectId, parsedInput.scope),
        ]);

        return updateOne(
            coupons,
            eq(coupons.id, coupon.id),
            {
                code,
                label: parsedInput.label?.trim(),
                discountType: parsedInput.discountType,
                discountValue: parsedInput.discountValue,
                scope: parsedInput.scope,
                status: parsedInput.status,
                validFrom: parsedInput.validFrom,
                validUntil: parsedInput.validUntil,
                maxUses: parsedInput.maxUses,
                maxUsesPerClient: parsedInput.maxUsesPerClient,
                minOrderAmount: parsedInput.minOrderAmount,
            },
            'Купон не найден',
        );
    });

export const deleteCouponAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(DeleteCouponActionInputSchema)
    .action(({ parsedInput: { id, projectId } }) =>
        softDeleteInProject(coupons, id, projectId, 'Купон не найден'),
    );

export const redeemCouponAction = projectMutationAction(
    Permission.MANAGE_FINANCES,
)
    .inputSchema(RedeemCouponActionInputSchema)
    .action(({ parsedInput, ctx: { userId } }) =>
        db.transaction(async (tx) => {
            const order = await lockOrder(
                tx,
                parsedInput.orderId,
                parsedInput.projectId,
            );

            return redeemCoupon(tx, order, parsedInput.code, userId);
        }),
    );
