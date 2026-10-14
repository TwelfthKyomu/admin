import type { NullToOptional } from '@/shared/lib/optional';
import type { ProductView as ServerProductView } from './Products.table';

export * from './Product.actions';
export * from './Product.schema';
export * from './Product.types';
export * from './useProducts';

export type ProductView = NullToOptional<ServerProductView>;
