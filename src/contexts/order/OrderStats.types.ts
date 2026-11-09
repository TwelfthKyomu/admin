import type { Currency } from '@/shared/constants/currency';
import type { MyDeliveryView } from '@/contexts/delivery/Delivery.types';
import type { MyShiftView } from '@/contexts/employeeShift/EmployeeShift.types';
import { commissionOf } from '@/contexts/payout/Payout.types';
import type { ProductType } from '@/contexts/product/Product.types';
import type { ProjectRecord } from '@/contexts/project/Projects.table';
import type { MyTaskView } from '@/contexts/task/Task.types';
import { OrderSource } from './Order.types';
import type { OrderRecord } from './Orders.table';

export interface ProjectRevenueView {
    projectId: string;
    currency: Currency;
    revenueAmount: number;
    refundedAmount: number;
    ordersCount: number;
    paidOrdersCount: number;
}

export type RecentOrderView = Pick<
    OrderRecord,
    | 'id'
    | 'projectId'
    | 'customerName'
    | 'totalAmount'
    | 'currency'
    | 'status'
    | 'createdAt'
>;

export interface TopOrderItemView {
    name: string;
    type: ProductType;
    currency: Currency;
    quantity: number;
    revenueAmount: number;
}

export interface CurrencyTotalsView {
    currency: Currency;
    revenueAmount: number;
    refundedAmount: number;
    ordersCount: number;
    paidOrdersCount: number;
    avgOrderValueAmount: number;
}

export interface DashboardStatsView {
    totals: CurrencyTotalsView[];
    byProject: ProjectRevenueView[];
    topItems: TopOrderItemView[];
    recentOrders: RecentOrderView[];
}

export function rollUpRevenueByCurrency(
    byProject: ProjectRevenueView[],
): CurrencyTotalsView[] {
    const byCurrency = new Map<Currency, CurrencyTotalsView>();

    for (const row of byProject) {
        const sum = byCurrency.get(row.currency) ?? {
            currency: row.currency,
            revenueAmount: 0,
            refundedAmount: 0,
            ordersCount: 0,
            paidOrdersCount: 0,
            avgOrderValueAmount: 0,
        };

        sum.revenueAmount += row.revenueAmount;
        sum.refundedAmount += row.refundedAmount;
        sum.ordersCount += row.ordersCount;
        sum.paidOrdersCount += row.paidOrdersCount;
        byCurrency.set(row.currency, sum);
    }

    return [...byCurrency.values()]
        .map((sum) => ({
            ...sum,
            avgOrderValueAmount:
                sum.paidOrdersCount > 0
                    ? Math.round(sum.revenueAmount / sum.paidOrdersCount)
                    : 0,
        }))
        .sort((a, b) => b.revenueAmount - a.revenueAmount);
}

export interface EmployeeRevenueView {
    employeeId: string | null;
    employeeName: string;
    ordersCount: number;
    revenueAmount: number;
}

export interface SalesSummaryView {
    ordersCount: number;
    storeRevenue: number;
    siteRevenue: number;
    storeEarned: number;
    siteEarned: number;
}

export interface MySalesView {
    projectId: string;
    currency: Currency;
    today: SalesSummaryView;
    month: SalesSummaryView;
}

export interface SellerRevenueRow {
    sellerId: string | null;
    source: OrderSource;
    ordersCount: number;
    revenueAmount: number;
}

export interface DashboardView {
    projects: ProjectRecord[];
    stats: DashboardStatsView;
}

export interface MyDayView {
    shifts: MyShiftView[];
    deliveries: MyDeliveryView[];
    tasks: MyTaskView[];
}

export function salesTotal(orders: Pick<OrderRecord, 'totalAmount'>[]): number {
    return orders.reduce((sum, order) => sum + order.totalAmount, 0);
}

export function summarizeSales(
    rows: SellerRevenueRow[],
    rates: { commissionRate: number; siteCommissionRate: number },
): SalesSummaryView {
    const revenueOf = (source: OrderSource) =>
        rows
            .filter((row) => row.source === source)
            .reduce((sum, row) => sum + row.revenueAmount, 0);

    const storeRevenue = revenueOf(OrderSource.STORE);
    const siteRevenue = revenueOf(OrderSource.STOREFRONT);

    return {
        ordersCount: rows.reduce((sum, row) => sum + row.ordersCount, 0),
        storeRevenue,
        siteRevenue,
        storeEarned: commissionOf(storeRevenue, rates.commissionRate),
        siteEarned: commissionOf(siteRevenue, rates.siteCommissionRate),
    };
}
