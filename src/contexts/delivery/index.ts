import type { NullToOptional } from '@/shared/lib/optional';
import type {
    CourierStatsView as ServerCourierStatsView,
    DeliveryView as ServerDeliveryView,
} from './Delivery.types';

export * from './Delivery.actions';
export * from './Delivery.schema';
export * from './Delivery.types';
export * from './DeliveryCourier.actions';
export * from './useDeliveries';

export type CourierStatsView = NullToOptional<ServerCourierStatsView>;
export type DeliveryView = NullToOptional<ServerDeliveryView>;
