import { db as testDb } from '@/infrastructure/database/client';
import { seedProject } from '@/infrastructure/database/testSeed';
import { insertOne } from '@/shared/api/repository';
import { orders } from '@/contexts/order/Orders.table';
import { products } from '@/contexts/product/Products.table';
import { eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    adjustStock,
    applyStockReturn,
    applyStockSale,
    reserveOrderStock,
} from './StockMovement.lib';
import { StockMovementReason } from './StockMovement.types';
import { stockMovements, stockReservations } from './StockMovements.table';

vi.mock('@/infrastructure/database/client', async () => {
    const { createTestDb } = await import('@/infrastructure/database/testDb');

    return { db: await createTestDb() };
});

let shop: Awaited<ReturnType<typeof seedProject>>;

async function createProduct(stock: number | null) {
    return insertOne(
        products,
        {
            projectId: shop.project.id,
            name: 'Футболка',
            slug: crypto.randomUUID(),
            sku: crypto.randomUUID().slice(0, 12),
            stock,
        },
        'Не удалось создать товар',
    );
}

async function createOrder() {
    return insertOne(
        orders,
        { projectId: shop.project.id, organizationId: shop.organization.id },
        'Не удалось создать заказ',
    );
}

async function stockOf(productId: string) {
    const [product] = await testDb
        .select({ stock: products.stock })
        .from(products)
        .where(eq(products.id, productId));

    return product?.stock;
}

function orderInput(orderId: string) {
    return { orderId, projectId: shop.project.id, createdBy: shop.user.id };
}

beforeEach(async () => {
    shop = await seedProject();
});

describe('бронь остатка', () => {
    it('не даёт забронировать больше свободного', async () => {
        const product = await createProduct(2);
        const first = await createOrder();
        const second = await createOrder();
        const line = { productId: product.id, variantId: null, quantity: 2 };

        await testDb.transaction((tx) =>
            reserveOrderStock(tx, {
                orderId: first.id,
                projectId: shop.project.id,
                lines: [line],
                expiresAt: null,
            }),
        );

        await expect(
            testDb.transaction((tx) =>
                reserveOrderStock(tx, {
                    orderId: second.id,
                    projectId: shop.project.id,
                    lines: [{ ...line, quantity: 1 }],
                    expiresAt: null,
                }),
            ),
        ).rejects.toThrow('свободно 0');
    });
});

describe('продажа и возврат', () => {
    it('продажа списывает остаток и снимает бронь, повтор не списывает', async () => {
        const product = await createProduct(5);
        const order = await createOrder();
        const lines = [{ productId: product.id, variantId: null, quantity: 3 }];

        await testDb.transaction((tx) =>
            reserveOrderStock(tx, {
                orderId: order.id,
                projectId: shop.project.id,
                lines,
                expiresAt: null,
            }),
        );

        await testDb.transaction((tx) =>
            applyStockSale(tx, { ...orderInput(order.id), lines }),
        );

        await testDb.transaction((tx) =>
            applyStockSale(tx, { ...orderInput(order.id), lines }),
        );

        expect(await stockOf(product.id)).toBe(2);

        const reservations = await testDb
            .select()
            .from(stockReservations)
            .where(eq(stockReservations.orderId, order.id));

        expect(reservations).toHaveLength(0);
    });

    it('возврат возвращает проданное', async () => {
        const product = await createProduct(5);
        const order = await createOrder();
        const lines = [{ productId: product.id, variantId: null, quantity: 2 }];

        await testDb.transaction((tx) =>
            applyStockSale(tx, { ...orderInput(order.id), lines }),
        );

        await testDb.transaction((tx) =>
            applyStockReturn(tx, orderInput(order.id)),
        );

        expect(await stockOf(product.id)).toBe(5);

        const reasons = await testDb
            .select({ reason: stockMovements.reason })
            .from(stockMovements)
            .where(eq(stockMovements.orderId, order.id));

        expect(reasons.map((row) => row.reason).toSorted()).toEqual([
            StockMovementReason.RETURN,
            StockMovementReason.SALE,
        ]);
    });

    it('продажа без учёта остатка не трогает число', async () => {
        const product = await createProduct(null);
        const order = await createOrder();

        await testDb.transaction((tx) =>
            applyStockSale(tx, {
                ...orderInput(order.id),
                lines: [
                    { productId: product.id, variantId: null, quantity: 4 },
                ],
            }),
        );

        expect(await stockOf(product.id)).toBeNull();
    });
});

describe('ручная правка', () => {
    it('ставит новое количество и пишет движение на разницу', async () => {
        const product = await createProduct(5);

        await testDb.transaction((tx) =>
            adjustStock(tx, {
                projectId: shop.project.id,
                productId: product.id,
                variantId: null,
                stock: 8,
                note: null,
                createdBy: shop.user.id,
            }),
        );

        expect(await stockOf(product.id)).toBe(8);

        const movements = await testDb
            .select({
                quantityDelta: stockMovements.quantityDelta,
                reason: stockMovements.reason,
            })
            .from(stockMovements)
            .where(eq(stockMovements.productId, product.id));

        expect(movements).toEqual([
            { quantityDelta: 3, reason: StockMovementReason.MANUAL },
        ]);
    });
});
