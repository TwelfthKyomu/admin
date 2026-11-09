import { type StockLevelView, stockKey } from '@/contexts/stockMovement';
import type { WarehouseView } from '@/contexts/warehouse';

export function productNames(rows: StockLevelView[]): Map<string, string> {
    return new Map(
        rows.map((row) => [
            stockKey({
                productId: row.productId,
                variantId: row.variantId ?? null,
            }),
            row.name,
        ]),
    );
}

export function warehouseNames(
    warehouses: WarehouseView[],
): Map<string, string> {
    return new Map(
        warehouses.map((warehouse) => [warehouse.id, warehouse.name]),
    );
}
