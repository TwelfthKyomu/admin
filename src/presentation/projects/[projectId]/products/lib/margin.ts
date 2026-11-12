import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';

export const marginLabel = (
    price: number | undefined,
    cost: number | null | undefined,
    currency: Currency,
): string | undefined => {
    if (!price || cost === null || cost === undefined) return undefined;

    const margin = price - cost;
    const percent = Math.round((margin / price) * 100);

    return `Маржа ${fmtMoney(margin, currency)} — ${percent}% от цены`;
};
