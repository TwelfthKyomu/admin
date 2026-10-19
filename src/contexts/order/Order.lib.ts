import 'server-only';

import { db, type Reader, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import {
    findInProject,
    insertOne,
    lockInProject,
} from '@/shared/api/repository';
import type { Currency } from '@/shared/constants/currency';
import { addClientSpending } from '@/contexts/client/Client.lib';
import { ProductType } from '@/contexts/product/Product.types';
import { products, productVariants } from '@/contexts/product/Products.table';
import {
    applyStockSale,
    reserveOrderStock,
} from '@/contexts/stockMovement/StockMovement.lib';
import { and, desc, eq, inArray, isNull } from 'drizzle-orm';
import type { OrderItemInput } from './Order.schema';
import {
    getNextOrderStatuses,
    isOrderTerminal,
    OrderEventType,
    OrderStatus,
    orderItemTotal,
    recomputePaymentStatus,
    stockLinesFromOrderItems,
} from './Order.types';
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

export function loadOrderItems(
    orderId: string,
    executor: Reader = db,
): Promise<OrderItemRecord[]> {
    return executor
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
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

export async function resolveOrderItems(
    projectId: string,
    items: OrderItemInput[],
    currency: Currency,
): Promise<OrderItemInput[]> {
    const productIds = [
        ...new Set(items.flatMap((item) => item.productId ?? [])),
    ];

    const [productRows, variantRows] = await Promise.all([
        db
            .select({
                id: products.id,
                type: products.type,
                currency: products.currency,
            })
            .from(products)
            .where(
                and(
                    eq(products.projectId, projectId),
                    inArray(products.id, productIds),
                    isNull(products.deletedAt),
                ),
            ),
        db
            .select({
                id: productVariants.id,
                productId: productVariants.productId,
            })
            .from(productVariants)
            .where(
                and(
                    eq(productVariants.projectId, projectId),
                    inArray(productVariants.productId, productIds),
                    eq(productVariants.isActive, true),
                ),
            ),
    ]);

    const productById = new Map(productRows.map((row) => [row.id, row]));

    const productOfVariant = new Map(
        variantRows.map((row) => [row.id, row.productId]),
    );

    const withVariants = new Set(variantRows.map((row) => row.productId));

    return items.map((item) => {
        if (!item.productId) {
            if (item.variantId) {
                throw new ApplicationError(
                    `Вариант позиции «${item.name}» указан без товара`,
                );
            }

            return item;
        }

        const product = productById.get(item.productId);

        if (!product) {
            throw new ApplicationError(
                `Товар позиции «${item.name}» не найден в проекте`,
            );
        }
        if (product.currency !== currency) {
            throw new ApplicationError(
                `Цена «${item.name}» указана в ${product.currency}, а заказ — в ${currency}. Поменяйте валюту товара.`,
            );
        }
        if (
            item.variantId &&
            productOfVariant.get(item.variantId) !== product.id
        ) {
            throw new ApplicationError(
                `Вариант позиции «${item.name}» не найден у этого товара`,
            );
        }
        if (
            !item.variantId &&
            product.type !== ProductType.SERVICE &&
            withVariants.has(product.id)
        ) {
            throw new ApplicationError(
                `Выберите вариант товара «${item.name}»`,
            );
        }

        return { ...item, type: product.type };
    });
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
    items: OrderItemInput[],
    event: Pick<OrderEventDraft, 'byUserId' | 'payload'>,
    reservedUntil: Date | null = null,
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
        expiresAt: reservedUntil,
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
    if (!getNextOrderStatuses(order.status).includes(status)) {
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
