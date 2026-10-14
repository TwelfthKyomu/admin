import type { NullToOptional } from '@/shared/lib/optional';
import type { StockLevelView as ServerStockLevelView } from './StockMovement.types';
import type { StockMovementView as ServerStockMovementView } from './StockMovements.table';

export * from './StockMovement.actions';
export * from './StockMovement.schema';
export * from './StockMovement.types';
export * from './useStockMovements';

export type StockLevelView = NullToOptional<ServerStockLevelView>;
export type StockMovementView = NullToOptional<ServerStockMovementView>;
