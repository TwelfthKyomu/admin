import { db as testDb } from '@/infrastructure/database/client';
import { seedProject } from '@/infrastructure/database/testSeed';
import { insertOne } from '@/shared/api/repository';
import { orders } from '@/contexts/order/Orders.table';
import { products } from '@/contexts/product/Products.table';
import {
    warehouseStock,
    warehouses,
} from '@/contexts/warehouse/Warehouses.table';
import { and, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    applyCatalogStockChanges,
    applyStockReturn,
    applyStockSale,
} from './StockMovement.lib';
import { StockMovementReason } from './StockMovement.types';
import { stockMovements, stockReservations } from './StockMovements.table';
import {
    countStock,
    receiveStock,
    transferStock,
    writeOffStock,
} from './StockOperation.lib';
import { reserveOrderStock } from './StockReservation.lib';

vi.mock('@/infrastructure/database/client', async () => {
    const { createTestDb } = await import('@/infrastructure/database/testDb');

    return { db: await createTestDb() };
});

let shop: Awaited<ReturnType<typeof seedProject>>;

const operation = (
    productId: string,
    warehouseId: string,
    quantity: number,
) => {
    return {
        projectId: shop.project.id,
        productId,
        variantId: null,
        warehouseId,
        quantity,
        note: null,
        createdBy: shop.user.id,
    };
};

const receipt = (
    productId: string,
    warehouseId: string,
    quantity: number,
    costAmount: number | null = null,
) => {
    return { ...operation(productId, warehouseId, quantity), costAmount };
};

const createWarehouse = async (name: string) => {
    return insertOne(
        warehouses,
        { projectId: shop.project.id, name, position: 1 },
        'Не удалось создать склад',
    );
};

const createProduct = async (quantity: number | null, warehouseId?: string) => {
    const product = await insertOne(
        products,
        {
            projectId: shop.project.id,
            name: 'Футболка',
            slug: crypto.randomUUID(),
            sku: crypto.randomUUID().slice(0, 12),
        },
        'Не удалось создать товар',
    );

    if (quantity) {
        await testDb.transaction((tx) =>
            receiveStock(
                tx,
                receipt(product.id, warehouseId ?? shop.warehouse.id, quantity),
            ),
        );
    }

    return product;
};

const createOrder = async () => {
    return insertOne(
        orders,
        { projectId: shop.project.id, organizationId: shop.organization.id },
        'Не удалось создать заказ',
    );
};

const stockOf = async (productId: string) => {
    const [product] = await testDb
        .select({ stock: products.stock })
        .from(products)
        .where(eq(products.id, productId));

    return product?.stock;
};

const quantityIn = async (warehouseId: string, productId: string) => {
    const [row] = await testDb
        .select({ quantity: warehouseStock.quantity })
        .from(warehouseStock)
        .where(
            and(
                eq(warehouseStock.warehouseId, warehouseId),
                eq(warehouseStock.productId, productId),
            ),
        );

    return row?.quantity ?? 0;
};

const reserve = (
    orderId: string,
    productId: string,
    quantity: number,
    warehouseIds: string[],
) => {
    return testDb.transaction((tx) =>
        reserveOrderStock(tx, {
            orderId,
            projectId: shop.project.id,
            lines: [{ productId, variantId: null, quantity }],
            expiresAt: null,
            warehouseIds,
        }),
    );
};

const orderInput = (orderId: string) => {
    return { orderId, projectId: shop.project.id, createdBy: shop.user.id };
};

beforeEach(async () => {
    shop = await seedProject();
});

describe('бронь остатка', () => {
    it('не даёт забронировать больше свободного', async () => {
        const product = await createProduct(2);
        const first = await createOrder();
        const second = await createOrder();

        await reserve(first.id, product.id, 2, [shop.warehouse.id]);

        await expect(
            reserve(second.id, product.id, 1, [shop.warehouse.id]),
        ).rejects.toThrow('свободно 0');
    });

    it('заказ с сайта набирает бронь с нескольких складов', async () => {
        const store = await createWarehouse('Магазин');
        const product = await createProduct(2);
        const order = await createOrder();

        await testDb.transaction((tx) =>
            receiveStock(tx, receipt(product.id, store.id, 3)),
        );

        await reserve(order.id, product.id, 4, [shop.warehouse.id, store.id]);

        const rows = await testDb
            .select({
                warehouseId: stockReservations.warehouseId,
                quantity: stockReservations.quantity,
            })
            .from(stockReservations)
            .where(eq(stockReservations.orderId, order.id));

        expect(rows).toHaveLength(2);

        expect(rows).toEqual(
            expect.arrayContaining([
                { warehouseId: shop.warehouse.id, quantity: 2 },
                { warehouseId: store.id, quantity: 2 },
            ]),
        );
    });
});

describe('продажа и возврат', () => {
    it('продажа списывает с забронированного склада, повтор не списывает', async () => {
        const store = await createWarehouse('Магазин');
        const product = await createProduct(5, store.id);
        const order = await createOrder();
        const lines = [{ productId: product.id, variantId: null, quantity: 3 }];

        await reserve(order.id, product.id, 3, [store.id]);

        await testDb.transaction((tx) =>
            applyStockSale(tx, { ...orderInput(order.id), lines }),
        );

        await testDb.transaction((tx) =>
            applyStockSale(tx, { ...orderInput(order.id), lines }),
        );

        expect(await stockOf(product.id)).toBe(2);
        expect(await quantityIn(store.id, product.id)).toBe(2);

        const reservations = await testDb
            .select()
            .from(stockReservations)
            .where(eq(stockReservations.orderId, order.id));

        expect(reservations).toHaveLength(0);
    });

    it('возврат возвращает проданное на тот же склад', async () => {
        const product = await createProduct(5);
        const order = await createOrder();

        await testDb.transaction((tx) =>
            applyStockSale(tx, {
                ...orderInput(order.id),
                lines: [
                    { productId: product.id, variantId: null, quantity: 2 },
                ],
            }),
        );

        await testDb.transaction((tx) =>
            applyStockReturn(tx, orderInput(order.id)),
        );

        expect(await stockOf(product.id)).toBe(5);
        expect(await quantityIn(shop.warehouse.id, product.id)).toBe(5);

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

describe('складские операции', () => {
    it('приёмка с ценой ставит среднюю закупочную цену', async () => {
        const product = await createProduct(null);

        for (const costAmount of [10_000, 20_000]) {
            await testDb.transaction((tx) =>
                receiveStock(
                    tx,
                    receipt(product.id, shop.warehouse.id, 2, costAmount),
                ),
            );
        }

        const [row] = await testDb
            .select({ costAmount: products.costAmount })
            .from(products)
            .where(eq(products.id, product.id));

        expect(row?.costAmount).toBe(15_000);
    });

    it('перемещение переносит товар между складами', async () => {
        const store = await createWarehouse('Магазин');
        const product = await createProduct(5);

        await testDb.transaction((tx) =>
            transferStock(tx, {
                ...operation(product.id, shop.warehouse.id, 3),
                toWarehouseId: store.id,
            }),
        );

        expect(await quantityIn(shop.warehouse.id, product.id)).toBe(2);
        expect(await quantityIn(store.id, product.id)).toBe(3);
        expect(await stockOf(product.id)).toBe(5);
    });

    it('нельзя списать забронированное', async () => {
        const product = await createProduct(3);
        const order = await createOrder();

        await reserve(order.id, product.id, 2, [shop.warehouse.id]);

        await expect(
            testDb.transaction((tx) =>
                writeOffStock(tx, operation(product.id, shop.warehouse.id, 2)),
            ),
        ).rejects.toThrow('свободно только 1');
    });

    it('пересчёт ставит фактическое количество', async () => {
        const product = await createProduct(5);

        await testDb.transaction((tx) =>
            countStock(tx, operation(product.id, shop.warehouse.id, 8)),
        );

        expect(await quantityIn(shop.warehouse.id, product.id)).toBe(8);
        expect(await stockOf(product.id)).toBe(8);
    });

    it('правка остатка в карточке товара идёт на основной склад', async () => {
        const product = await createProduct(5);

        await testDb
            .update(products)
            .set({ stock: 7 })
            .where(eq(products.id, product.id));

        await testDb.transaction((tx) =>
            applyCatalogStockChanges(tx, [
                {
                    projectId: shop.project.id,
                    productId: product.id,
                    variantId: null,
                    before: 5,
                    after: 7,
                    note: null,
                    createdBy: shop.user.id,
                },
            ]),
        );

        expect(await quantityIn(shop.warehouse.id, product.id)).toBe(7);
    });
});
