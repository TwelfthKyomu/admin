import type { NullToOptional } from '@/shared/lib/optional';
import type { WarehouseView as ServerWarehouseView } from './Warehouses.table';

export * from './useWarehouses';
export * from './Warehouse.actions';
export * from './Warehouse.schema';
export * from './Warehouse.types';

export type WarehouseView = NullToOptional<ServerWarehouseView>;
