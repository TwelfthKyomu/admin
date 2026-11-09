export const PRIMARY_WAREHOUSE_NAME = 'Основной склад';

export interface WarehouseFree {
    warehouseId: string;
    free: number;
}

export interface WarehouseAllocation {
    warehouseId: string;
    quantity: number;
}

export function allocateAcrossWarehouses(
    quantity: number,
    candidates: WarehouseFree[],
): WarehouseAllocation[] | null {
    const allocations: WarehouseAllocation[] = [];
    let left = quantity;

    for (const { warehouseId, free } of candidates) {
        if (left === 0) break;

        const taken = Math.min(left, Math.max(0, free));

        if (taken === 0) continue;

        allocations.push({ warehouseId, quantity: taken });
        left -= taken;
    }

    return left === 0 ? allocations : null;
}
