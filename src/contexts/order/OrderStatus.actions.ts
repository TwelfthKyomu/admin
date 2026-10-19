'use server';

import { db } from '@/infrastructure/database/client';
import { projectMutationAction } from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { reverseCouponRedemptionsForOrder } from '@/contexts/coupon/Coupon.lib';
import { cancelActiveDelivery } from '@/contexts/delivery/Delivery.lib';
import { findMemberIdByUserId } from '@/contexts/organizationMember/OrganizationMember.lib';
import { applyStockReturn } from '@/contexts/stockMovement/StockMovement.lib';
import { Permission } from '@/contexts/user/User.types';
import { changeOrderStatus, lockOrder, setOrderSeller } from './Order.lib';
import { ChangeOrderStatusActionInputSchema } from './Order.schema';
import {
    confirmationSeller,
    isOrderCancelled,
    isOrderTerminal,
    OrderStatus,
} from './Order.types';

export const changeOrderStatusAction = projectMutationAction(
    Permission.MANAGE_ORDERS,
)
    .inputSchema(ChangeOrderStatusActionInputSchema)
    .action(({ parsedInput, ctx: { userId, organizationId } }) =>
        db.transaction(async (tx) => {
            const order = await lockOrder(
                tx,
                parsedInput.id,
                parsedInput.projectId,
            );

            if (isOrderTerminal(order.status)) {
                throw new ApplicationError('Заказ уже в финальном статусе');
            }

            const next = parsedInput.nextStatus;

            const changed = await changeOrderStatus(tx, order, next, {
                byUserId: userId,
                reason: parsedInput.reason?.trim() || null,
            });

            const sellerId =
                next === OrderStatus.CONFIRMED
                    ? confirmationSeller(
                          changed,
                          await findMemberIdByUserId(organizationId, userId),
                      )
                    : changed.sellerId;

            const row =
                sellerId === changed.sellerId
                    ? changed
                    : await setOrderSeller(tx, changed, sellerId, userId);

            if (isOrderCancelled(next)) {
                await reverseCouponRedemptionsForOrder(tx, order.id);

                await applyStockReturn(tx, {
                    orderId: order.id,
                    projectId: order.projectId,
                    createdBy: userId,
                });

                await cancelActiveDelivery(tx, order.id, userId);
            }

            return row;
        }),
    );
