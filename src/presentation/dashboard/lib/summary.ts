import { DEFAULT_CURRENCY } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import { pluralRu } from '@/shared/format/plural';
import type { CurrencyTotalsView, DashboardStatsView } from '@/contexts/order';

const ORDERS_PLURAL: [string, string, string] = ['заказ', 'заказа', 'заказов'];

const EMPTY_TOTALS: CurrencyTotalsView = {
    currency: DEFAULT_CURRENCY,
    revenueAmount: 0,
    refundedAmount: 0,
    ordersCount: 0,
    paidOrdersCount: 0,
    avgOrderValueAmount: 0,
};

export interface DashboardSummary {
    revenue: string;
    facts: string[];
}

export function dashboardSummary(stats: DashboardStatsView): DashboardSummary {
    const [main = EMPTY_TOTALS, ...others] = stats.totals;
    const { ordersCount, paidOrdersCount, refundedAmount, currency } = main;

    const paidShare =
        ordersCount > 0 ? Math.round((paidOrdersCount / ordersCount) * 100) : 0;

    return {
        revenue: fmtMoney(main.revenueAmount, currency),
        facts: [
            `${ordersCount} ${pluralRu(ordersCount, ORDERS_PLURAL)}, ${paidShare}% оплачено`,
            `средний чек ${fmtMoney(main.avgOrderValueAmount, currency)}`,
            refundedAmount > 0
                ? `возвраты ${fmtMoney(refundedAmount, currency)}`
                : 'без возвратов',
            ...others.map(
                (totals) =>
                    `ещё ${fmtMoney(totals.revenueAmount, totals.currency)}`,
            ),
        ],
    };
}
