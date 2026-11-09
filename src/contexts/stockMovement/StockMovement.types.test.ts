import { describe, expect, it } from 'vitest';
import {
    mergeStockLines,
    saleAllocations,
    siteStock,
    stockKey,
} from './StockMovement.types';

describe('siteStock', () => {
    it('показывает свободное на складах для сайта', () => {
        expect(siteStock(10, 7)).toBe(7);
    });

    it('без строк на складах для сайта — ноль', () => {
        expect(siteStock(5, undefined)).toBe(0);
    });

    it('без учёта остатка остаётся без учёта', () => {
        expect(siteStock(null, 3)).toBeNull();
    });
});

describe('saleAllocations', () => {
    const line = { productId: 'p', variantId: null, quantity: 5 };

    it('списывает по броням, остаток — с основного склада', () => {
        expect(
            saleAllocations(
                line,
                [
                    {
                        productId: 'p',
                        variantId: null,
                        warehouseId: 'a',
                        quantity: 2,
                    },
                    {
                        productId: 'x',
                        variantId: null,
                        warehouseId: 'a',
                        quantity: 9,
                    },
                    {
                        productId: 'p',
                        variantId: null,
                        warehouseId: 'b',
                        quantity: 1,
                    },
                ],
                'main',
            ),
        ).toEqual([
            { productId: 'p', variantId: null, warehouseId: 'a', quantity: 2 },
            { productId: 'p', variantId: null, warehouseId: 'b', quantity: 1 },
            {
                productId: 'p',
                variantId: null,
                warehouseId: 'main',
                quantity: 2,
            },
        ]);
    });

    it('без броней — всё с основного склада', () => {
        expect(saleAllocations(line, [], 'main')).toEqual([
            { ...line, warehouseId: 'main' },
        ]);
    });
});

describe('mergeStockLines', () => {
    it('складывает одинаковые позиции и пропускает пустые', () => {
        expect(
            mergeStockLines([
                { productId: 'a', variantId: 'm', quantity: 1 },
                { productId: 'a', variantId: 'm', quantity: 2 },
                { productId: 'a', variantId: null, quantity: 0 },
            ]),
        ).toEqual([{ productId: 'a', variantId: 'm', quantity: 3 }]);
    });

    it('сортирует позиции по ключу, чтобы блокировки шли в одном порядке', () => {
        const lines = mergeStockLines([
            { productId: 'b', variantId: null, quantity: 1 },
            { productId: 'a', variantId: 'xl', quantity: 1 },
            { productId: 'a', variantId: 'm', quantity: 1 },
        ]);

        expect(lines.map(stockKey)).toEqual(['b', 'm', 'xl']);
    });
});
