import type { NullToOptional } from '@/shared/lib/optional';
import type {
    CurrencyTotalsView as ServerCurrencyTotalsView,
    DashboardStatsView as ServerDashboardStatsView,
    EmployeeRevenueView as ServerEmployeeRevenueView,
    MyBookingView as ServerMyBookingView,
    MyDayView as ServerMyDayView,
    ProjectRevenueView as ServerProjectRevenueView,
    RecentOrderView as ServerRecentOrderView,
    TopOrderItemView as ServerTopOrderItemView,
} from './Order.types';
import type {
    OrderEventView as ServerOrderEventView,
    OrderItemView as ServerOrderItemView,
    OrderView as ServerOrderView,
} from './Orders.table';

export * from './Order.actions';
export * from './Order.schema';
export * from './Order.types';
export * from './OrderPayment.actions';
export * from './OrderSeller.actions';
export * from './OrderStats.actions';
export * from './OrderStatus.actions';
export * from './useOrders';

export type CurrencyTotalsView = NullToOptional<ServerCurrencyTotalsView>;
export type DashboardStatsView = NullToOptional<ServerDashboardStatsView>;
export type EmployeeRevenueView = NullToOptional<ServerEmployeeRevenueView>;
export type MyBookingView = NullToOptional<ServerMyBookingView>;
export type MyDayView = NullToOptional<ServerMyDayView>;
export type ProjectRevenueView = NullToOptional<ServerProjectRevenueView>;
export type RecentOrderView = NullToOptional<ServerRecentOrderView>;
export type TopOrderItemView = NullToOptional<ServerTopOrderItemView>;
export type OrderEventView = NullToOptional<ServerOrderEventView>;
export type OrderItemView = NullToOptional<ServerOrderItemView>;
export type OrderView = NullToOptional<ServerOrderView>;
