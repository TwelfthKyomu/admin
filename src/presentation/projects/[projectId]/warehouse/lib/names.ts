import { type StockLevelView, stockKey } from '@/contexts/stockMovement';

export const productNames = (rows: StockLevelView[]): Map<string, string> => {
    return new Map(
        rows.map((row) => [
            stockKey({
                productId: row.productId,
                variantId: row.variantId ?? null,
            }),
            row.name,
        ]),
    );
};
