import 'server-only';

import { db } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { getErrorMessage } from '@/shared/lib/errors';
import { findOrCreateClient } from '@/contexts/client/Client.lib';
import { previewCoupon, redeemCoupon } from '@/contexts/coupon/Coupon.lib';
import {
    createOrderWithItems,
    findClientOrders,
    loadOrderItems,
    resolveOrderItems,
} from '@/contexts/order/Order.lib';
import type { OrderItemInput } from '@/contexts/order/Order.schema';
import {
    OrderSource,
    OrderType,
    orderAmountDue,
    orderItemTotal,
    sumOrderItems,
} from '@/contexts/order/Order.types';
import { mailOrderPlaced } from '@/contexts/order/OrderMail.lib';
import {
    type OrderItemRecord,
    type OrderRecord,
    orders,
} from '@/contexts/order/Orders.table';
import {
    findActiveProviderId,
    startOnlinePayment,
} from '@/contexts/paymentIntent/PaymentIntent.lib';
import { loadVariants } from '@/contexts/product/Product.lib';
import {
    ProductType,
    SELLABLE_PRODUCT_STATUSES,
    variantComboLabel,
} from '@/contexts/product/Product.types';
import { products } from '@/contexts/product/Products.table';
import { STOCK_RESERVATION_MINUTES } from '@/contexts/stockMovement/StockMovement.types';
import { addMinutes } from 'date-fns';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { after } from 'next/server';
import {
    revalidateStorefronts,
    StorefrontNotFoundError,
} from './Storefront.lib';
import type {
    StorefrontCouponPreviewInput,
    StorefrontOrderInput,
} from './Storefront.schema';
import { type StorefrontAccess, toMajorUnits } from './Storefront.types';

const CLIENT_ORDERS_LIMIT = 50;
const ORDER_ID_PLACEHOLDER = '{orderId}';

async function priceStorefrontItems(
    access: StorefrontAccess,
    items: StorefrontOrderInput['items'],
): Promise<OrderItemInput[]> {
    const productIds = [...new Set(items.map((item) => item.productId))];

    const [productRows, variantsByProduct] = await Promise.all([
        db
            .select()
            .from(products)
            .where(
                and(
                    eq(products.projectId, access.projectId),
                    inArray(products.id, productIds),
                    inArray(products.status, SELLABLE_PRODUCT_STATUSES),
                    isNull(products.deletedAt),
                ),
            ),
        loadVariants(productIds),
    ]);

    const productById = new Map(productRows.map((row) => [row.id, row]));

    return items.map((item) => {
        const product = productById.get(item.productId);

        if (!product) {
            throw new ApplicationError(`Товар ${item.productId} не продаётся`);
        }
        if (product.type === ProductType.SERVICE) {
            throw new ApplicationError(
                `«${product.name}» — услуга, её записывают через администратора`,
            );
        }

        const variants = (variantsByProduct.get(product.id) ?? []).filter(
            (candidate) => candidate.isActive,
        );

        const variant = variants.find(
            (candidate) => candidate.id === item.variantId,
        );

        if (item.variantId ? !variant : variants.length > 0) {
            throw new ApplicationError(
                `Выберите доступный вариант «${product.name}»`,
            );
        }

        return {
            productId: product.id,
            variantId: item.variantId ?? null,
            name: variant
                ? `${product.name} (${variantComboLabel(variant.optionValues)})`
                : product.name,
            type: product.type,
            unitPriceAmount: variant?.price ?? product.price,
            quantity: item.quantity,
        };
    });
}

export async function previewStorefrontCoupon(
    access: StorefrontAccess,
    input: StorefrontCouponPreviewInput,
) {
    const items = (await priceStorefrontItems(access, input.items)).map(
        (item) => ({
            productId: item.productId ?? null,
            totalAmount: orderItemTotal(item),
        }),
    );

    const subtotal = items.reduce((sum, item) => sum + item.totalAmount, 0);
    const discount = await previewCoupon(access.projectId, input.code, items);

    return {
        discountAmount: toMajorUnits(discount),
        totalAmount: toMajorUnits(subtotal - discount),
    };
}

export async function createStorefrontOrder(
    access: StorefrontAccess,
    input: StorefrontOrderInput,
) {
    const [providerId, pricedItems] = await Promise.all([
        input.payment ? findActiveProviderId(access.projectId) : null,
        priceStorefrontItems(access, input.items),
    ]);

    const items = await resolveOrderItems(
        access.projectId,
        pricedItems,
        access.currency,
    );

    const subtotalAmount = sumOrderItems(items);

    const payUntil =
        providerId && input.payment
            ? addMinutes(new Date(), STOCK_RESERVATION_MINUTES)
            : null;

    const { order, items: savedItems } = await db.transaction(async (tx) => {
        const clientId = await findOrCreateClient(tx, access.projectId, {
            name: input.customerName,
            email: input.customerEmail,
            phone: input.customerPhone,
        });

        const created = await createOrderWithItems(
            tx,
            {
                projectId: access.projectId,
                organizationId: access.organizationId,
                type: OrderType.SALE,
                source: OrderSource.STOREFRONT,
                clientId,
                customerName: input.customerName,
                customerPhone: input.customerPhone ?? null,
                customerEmail: input.customerEmail ?? null,
                currency: access.currency,
                subtotalAmount,
                discountAmount: 0,
                totalAmount: subtotalAmount,
                notes: input.notes?.trim() || null,
            },
            items,
            {
                byUserId: null,
                payload: {
                    source: 'storefront',
                    integrationId: access.integrationId,
                },
            },
            payUntil,
        );

        if (!input.couponCode) return created;

        const redeemed = await redeemCoupon(
            tx,
            created.order,
            input.couponCode,
            null,
        );

        return { order: redeemed.order, items: created.items };
    });

    after(() => revalidateStorefronts(access.projectId));

    const view = toStorefrontOrder(order, savedItems);

    const amountDue = orderAmountDue(order);

    if (!providerId || !input.payment || amountDue === 0) {
        after(() => mailOrderPlaced(order.id));

        return view;
    }

    try {
        const intent = await startOnlinePayment({
            projectId: access.projectId,
            integrationId: providerId,
            orderId: order.id,
            amount: amountDue,
            currency: order.currency,
            returnUrl: input.payment.returnUrl.replace(
                ORDER_ID_PLACEHOLDER,
                order.id,
            ),
            description: 'Оплата заказа',
            expiresAt: payUntil ?? undefined,
        });

        return {
            ...view,
            confirmationUrl: intent.confirmationUrl ?? undefined,
        };
    } catch (error) {
        return {
            ...view,
            paymentError: getErrorMessage(error) ?? undefined,
        };
    }
}

function toStorefrontOrder(order: OrderRecord, items: OrderItemRecord[]) {
    return {
        id: order.id,
        status: order.status,
        paymentStatus: order.paymentStatus,
        currency: order.currency,
        subtotalAmount: toMajorUnits(order.subtotalAmount),
        discountAmount: toMajorUnits(order.discountAmount),
        totalAmount: toMajorUnits(order.totalAmount),
        paidAmount: toMajorUnits(order.paidAmount),
        refundedAmount: toMajorUnits(order.refundedAmount),
        amountDue: toMajorUnits(orderAmountDue(order)),
        createdAt: order.createdAt,
        items: items.map((item) => ({
            productId: item.productId ?? undefined,
            variantId: item.variantId ?? undefined,
            name: item.name,
            quantity: item.quantity,
            unitPriceAmount: toMajorUnits(item.unitPriceAmount),
            totalAmount: toMajorUnits(item.totalAmount),
        })),
    };
}

export async function loadClientOrders(
    access: StorefrontAccess,
    clientId: string,
) {
    const rows = await findClientOrders(
        access.projectId,
        clientId,
        CLIENT_ORDERS_LIMIT,
    );

    return rows.map(({ order, items }) => toStorefrontOrder(order, items));
}

export async function loadStorefrontOrder(
    access: StorefrontAccess,
    orderId: string,
) {
    const [[order], items] = await Promise.all([
        db
            .select()
            .from(orders)
            .where(
                and(
                    eq(orders.id, orderId),
                    eq(orders.projectId, access.projectId),
                ),
            )
            .limit(1),
        loadOrderItems(orderId),
    ]);

    if (!order) throw new StorefrontNotFoundError('Заказ не найден');

    return toStorefrontOrder(order, items);
}
