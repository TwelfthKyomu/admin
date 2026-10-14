import { describe, expect, it } from 'vitest';
import { freeStock, mergeStockLines, stockKey } from './StockMovement.types';

describe('freeStock', () => {
    it('вычитает брони из остатка', () => {
        expect(freeStock(10, 3)).toBe(7);
    });

    it('без броней равен остатку', () => {
        expect(freeStock(5)).toBe(5);
    });

    it('не уходит в минус, если брони больше остатка', () => {
        expect(freeStock(2, 5)).toBe(0);
    });

    it('без учёта остатка остаётся без учёта', () => {
        expect(freeStock(null, 3)).toBeNull();
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
