import { describe, expect, it } from 'vitest';
import { allocateAcrossWarehouses } from './Warehouse.types';

describe('allocateAcrossWarehouses', () => {
    it('берёт со складов по порядку', () => {
        expect(
            allocateAcrossWarehouses(5, [
                { warehouseId: 'a', free: 3 },
                { warehouseId: 'b', free: 10 },
            ]),
        ).toEqual([
            { warehouseId: 'a', quantity: 3 },
            { warehouseId: 'b', quantity: 2 },
        ]);
    });

    it('пропускает пустые склады', () => {
        expect(
            allocateAcrossWarehouses(2, [
                { warehouseId: 'a', free: 0 },
                { warehouseId: 'b', free: -1 },
                { warehouseId: 'c', free: 2 },
            ]),
        ).toEqual([{ warehouseId: 'c', quantity: 2 }]);
    });

    it('возвращает null, если на всех складах не хватает', () => {
        expect(
            allocateAcrossWarehouses(4, [
                { warehouseId: 'a', free: 1 },
                { warehouseId: 'b', free: 2 },
            ]),
        ).toBeNull();
    });
});
