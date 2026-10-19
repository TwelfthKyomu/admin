import type { NullToOptional } from '@/shared/lib/optional';
import type {
    CurrencyTotalsView as ServerCurrencyTotalsView,
    DashboardStatsView as ServerDashboardStatsView,
    EmployeeRevenueView as ServerEmployeeRevenueView,
    MyDayView as ServerMyDayView,
    MySalesView as ServerMySalesView,
    OrderListView as ServerOrderListView,
    ProjectRevenueView as ServerProjectRevenueView,
    RecentOrderView as ServerRecentOrderView,
    SalesSummaryView as ServerSalesSummaryView,
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
export type MyDayView = NullToOptional<ServerMyDayView>;
export type MySalesView = NullToOptional<ServerMySalesView>;
export type SalesSummaryView = NullToOptional<ServerSalesSummaryView>;
export type ProjectRevenueView = NullToOptional<ServerProjectRevenueView>;
export type RecentOrderView = NullToOptional<ServerRecentOrderView>;
export type TopOrderItemView = NullToOptional<ServerTopOrderItemView>;
export type OrderEventView = NullToOptional<ServerOrderEventView>;
export type OrderItemView = NullToOptional<ServerOrderItemView>;
export type OrderView = NullToOptional<ServerOrderView>;
export type OrderListView = NullToOptional<ServerOrderListView>;
