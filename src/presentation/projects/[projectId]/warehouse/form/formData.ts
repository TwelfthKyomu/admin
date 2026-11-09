import type {
    CountStockActionInputSchema,
    TransferStockActionInputSchema,
} from '@/contexts/stockMovement';
import type {
    CreateWarehouseActionInputSchema,
    UpdateWarehouseActionInputSchema,
} from '@/contexts/warehouse';
import type * as z from 'zod/mini';

export type StockOperationFormValues = z.input<
    typeof CountStockActionInputSchema
>;

export type StockTransferFormValues = z.input<
    typeof TransferStockActionInputSchema
>;

export type CreateWarehouseFormValues = z.input<
    typeof CreateWarehouseActionInputSchema
>;

export type UpdateWarehouseFormValues = z.input<
    typeof UpdateWarehouseActionInputSchema
>;

export const WAREHOUSE_DEFAULT = { name: '', forSite: true };
