import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import { pluralRu } from '@/shared/format/plural';
import type { SalesSummaryView } from '@/contexts/order';

const SALES_PLURAL: [string, string, string] = ['продажа', 'продажи', 'продаж'];

export function salesLine(
    summary: SalesSummaryView,
    currency: Currency,
): string {
    const total = summary.storeRevenue + summary.siteRevenue;

    return `${summary.ordersCount} ${pluralRu(summary.ordersCount, SALES_PLURAL)} · ${fmtMoney(total, currency)}`;
}

export function earnedLine(
    summary: SalesSummaryView,
    currency: Currency,
): string {
    const store = `заработано ${fmtMoney(summary.storeEarned, currency)}`;

    if (summary.siteRevenue === 0) return store;

    return `${store} · с сайта ${fmtMoney(summary.siteEarned, currency)}`;
}
