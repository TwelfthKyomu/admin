import { db as testDb } from '@/infrastructure/database/client';
import { seedProject } from '@/infrastructure/database/testSeed';
import { projectCategories } from '@/contexts/projectCategory/ProjectCategories.table';
import { warehouseStock } from '@/contexts/warehouse/Warehouses.table';
import { and, eq } from 'drizzle-orm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { importProducts } from './ProductImport.lib';
import type { ProductImportRow } from './ProductImport.types';
import { products } from './Products.table';

vi.mock('@/infrastructure/database/client', async () => {
    const { createTestDb } = await import('@/infrastructure/database/testDb');

    return { db: await createTestDb() };
});

let shop: Awaited<ReturnType<typeof seedProject>>;

const row = (patch: Partial<ProductImportRow>): ProductImportRow => {
    return {
        name: 'Футболка',
        sku: 'TS-01',
        price: 199000,
        costAmount: null,
        barcode: null,
        category: null,
        stock: null,
        description: null,
        ...patch,
    };
};

const runImport = (rows: ProductImportRow[]) => {
    return importProducts(
        {
            projectId: shop.project.id,
            organizationId: shop.organization.id,
            warehouseId: shop.warehouse.id,
            createdBy: shop.user.id,
        },
        rows,
    );
};

beforeEach(async () => {
    shop = await seedProject();
});

describe('импорт товаров', () => {
    it('создаёт товары, категорию и остаток на складе', async () => {
        const result = await runImport([
            row({ category: 'Футболки', stock: 7 }),
            row({ name: 'Худи', sku: 'HD-01', category: 'футболки' }),
        ]);

        expect(result).toEqual({ created: 2, updated: 0, failed: [] });

        const categories = await testDb
            .select({ name: projectCategories.name })
            .from(projectCategories)
            .where(eq(projectCategories.projectId, shop.project.id));

        expect(categories).toEqual([{ name: 'Футболки' }]);

        const [stock] = await testDb
            .select({ quantity: warehouseStock.quantity })
            .from(warehouseStock)
            .where(eq(warehouseStock.warehouseId, shop.warehouse.id));

        expect(stock?.quantity).toBe(7);
    });

    it('обновляет товар с тем же артикулом и сообщает об ошибочных строках', async () => {
        await runImport([row({ barcode: '4600000000001' })]);

        const result = await runImport([
            row({ price: 249000 }),
            row({ name: 'Кепка', sku: 'CP-01', barcode: '4600000000001' }),
        ]);

        expect(result.updated).toBe(1);

        expect(result.failed).toEqual([
            { sku: 'CP-01', message: 'Товар с таким штрихкодом уже есть' },
        ]);

        const [product] = await testDb
            .select({ price: products.price })
            .from(products)
            .where(
                and(
                    eq(products.projectId, shop.project.id),
                    eq(products.sku, 'TS-01'),
                ),
            );

        expect(product?.price).toBe(249000);
    });
});
