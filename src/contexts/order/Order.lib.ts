import 'server-only';

import { db, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import {
    findInProject,
    insertOne,
    lockInProject,
} from '@/shared/api/repository';
import { addClientSpending } from '@/contexts/client/Client.lib';
import { hasOpenDelivery } from '@/contexts/delivery/Delivery.lib';
import { applyStockSale } from '@/contexts/stockMovement/StockMovement.lib';
import { reserveOrderStock } from '@/contexts/stockMovement/StockReservation.lib';
import { and, desc, eq, inArray } from 'drizzle-orm';
import {
    getNextOrderStatuses,
    isOrderTerminal,
    OrderEventType,
    OrderStatus,
    orderItemTotal,
    type ResolvedOrderItem,
    recomputePaymentStatus,
    stockLinesFromOrderItems,
} from './Order.types';
import { loadOrderItems } from './OrderItem.lib';
import {
    type NewOrderEventRecord,
    type NewOrderRecord,
    type OrderItemRecord,
    type OrderRecord,
    orderEvents,
    orderItems,
    orders,
} from './Orders.table';

type OrderEventDraft = Omit<NewOrderEventRecord, 'orderId'>;

export function findOrderInProject(
    id: string,
    projectId: string,
): Promise<OrderRecord> {
    return findInProject(orders, id, projectId, 'Заказ не найден');
}

export function lockOrder(
    tx: Tx,
    id: string,
    projectId: string,
): Promise<OrderRecord> {
    return lockInProject(tx, orders, id, projectId, 'Заказ не найден');
}

export async function findClientOrders(
    projectId: string,
    clientId: string,
    limit: number,
): Promise<{ order: OrderRecord; items: OrderItemRecord[] }[]> {
    const orderRows = await db
        .select()
        .from(orders)
        .where(
            and(eq(orders.clientId, clientId), eq(orders.projectId, projectId)),
        )
        .orderBy(desc(orders.createdAt))
        .limit(limit);

    const itemRows = orderRows.length
        ? await db
              .select()
              .from(orderItems)
              .where(
                  inArray(
                      orderItems.orderId,
                      orderRows.map((order) => order.id),
                  ),
              )
        : [];

    const itemsByOrder = Map.groupBy(itemRows, (item) => item.orderId);

    return orderRows.map((order) => ({
        order,
        items: itemsByOrder.get(order.id) ?? [],
    }));
}

export async function recordOrderEvents(
    tx: Tx,
    events: NewOrderEventRecord[],
): Promise<void> {
    if (events.length === 0) return;

    await tx.insert(orderEvents).values(events);
}

export async function createOrderWithItems(
    tx: Tx,
    values: NewOrderRecord,
    items: ResolvedOrderItem[],
    event: Pick<OrderEventDraft, 'byUserId' | 'payload'>,
    reservation: { warehouseIds: string[]; expiresAt: Date | null },
): Promise<{ order: OrderRecord; items: OrderItemRecord[] }> {
    const order = await insertOne(
        orders,
        values,
        'Не удалось создать заказ',
        tx,
    );

    const savedItems =
        items.length > 0
            ? await tx
                  .insert(orderItems)
                  .values(
                      items.map((item) => ({
                          orderId: order.id,
                          productId: item.productId ?? null,
                          variantId: item.variantId ?? null,
                          name: item.name.trim(),
                          type: item.type,
                          unitPriceAmount: item.unitPriceAmount,
                          unitCostAmount: item.unitCostAmount,
                          quantity: item.quantity,
                          totalAmount: orderItemTotal(item),
                      })),
                  )
                  .returning()
            : [];

    await reserveOrderStock(tx, {
        orderId: order.id,
        projectId: order.projectId,
        lines: stockLinesFromOrderItems(savedItems),
        ...reservation,
    });

    await recordOrderEvents(tx, [
        {
            orderId: order.id,
            type: OrderEventType.CREATED,
            byUserId: event.byUserId,
            payload: {
                itemCount: items.length,
                ...event.payload,
            },
        },
    ]);

    return { order, items: savedItems };
}

export async function writeOrderUpdate(
    tx: Tx,
    order: OrderRecord,
    values: Partial<OrderRecord>,
    event: OrderEventDraft,
): Promise<OrderRecord> {
    const [updated] = await tx
        .update(orders)
        .set(values)
        .where(eq(orders.id, order.id))
        .returning();

    if (!updated) throw new ApplicationError('Заказ не найден');

    await recordOrderEvents(tx, [{ ...event, orderId: order.id }]);

    return updated;
}

export async function changeOrderStatus(
    tx: Tx,
    order: OrderRecord,
    status: OrderStatus,
    event: { byUserId: string | null; reason: string | null },
): Promise<OrderRecord> {
    const hasDelivery =
        status === OrderStatus.READY && (await hasOpenDelivery(tx, order.id));

    if (!getNextOrderStatuses(order.status, { hasDelivery }).includes(status)) {
        throw new ApplicationError(
            `Недопустимый переход статуса: ${order.status} → ${status}`,
        );
    }

    const completedAt =
        status === OrderStatus.COMPLETED ? new Date() : undefined;

    const updated = await writeOrderUpdate(
        tx,
        order,
        { status, completedAt },
        {
            type: OrderEventType.STATUS_CHANGED,
            byUserId: event.byUserId,
            payload: { from: order.status, to: status, reason: event.reason },
        },
    );

    if (!completedAt) return updated;

    await applyStockSale(tx, {
        orderId: order.id,
        projectId: order.projectId,
        createdBy: event.byUserId,
        lines: stockLinesFromOrderItems(await loadOrderItems(order.id, tx)),
    });

    if (order.clientId && updated.totalAmount > 0) {
        await addClientSpending(tx, order.clientId, {
            orders: 1,
            amount: updated.totalAmount - updated.refundedAmount,
            visitedAt: completedAt,
        });
    }

    return updated;
}

export async function completeOrder(
    tx: Tx,
    order: OrderRecord,
    event: { byUserId: string | null; reason: string | null },
): Promise<OrderRecord> {
    const confirmed =
        order.status === OrderStatus.PENDING
            ? await changeOrderStatus(tx, order, OrderStatus.CONFIRMED, event)
            : order;

    return changeOrderStatus(tx, confirmed, OrderStatus.COMPLETED, event);
}

export function setOrderSeller(
    tx: Tx,
    order: OrderRecord,
    sellerId: string | null,
    byUserId: string | null,
): Promise<OrderRecord> {
    return writeOrderUpdate(
        tx,
        order,
        { sellerId, soldAt: order.soldAt ?? new Date() },
        {
            type: OrderEventType.SELLER_CHANGED,
            byUserId,
            payload: { from: order.sellerId, to: sellerId },
        },
    );
}

export async function addOrderDiscount(
    tx: Tx,
    order: OrderRecord,
    amount: number,
    byUserId: string | null,
): Promise<OrderRecord> {
    if (isOrderTerminal(order.status)) {
        throw new ApplicationError('Нельзя менять скидку завершённого заказа');
    }

    const discountAmount = order.discountAmount + amount;

    if (discountAmount > order.subtotalAmount) {
        throw new ApplicationError('Скидка не может превышать сумму позиций');
    }

    const totalAmount = order.subtotalAmount - discountAmount;

    return writeOrderUpdate(
        tx,
        order,
        {
            discountAmount,
            totalAmount,
            paymentStatus: recomputePaymentStatus({ ...order, totalAmount }),
        },
        {
            type: OrderEventType.DISCOUNT_APPLIED,
            byUserId,
            payload: { from: order.discountAmount, to: discountAmount },
        },
    );
}
