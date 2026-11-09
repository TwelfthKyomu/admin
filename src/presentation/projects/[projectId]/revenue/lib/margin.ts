import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import { pluralRu } from '@/shared/format/plural';
import type { MarginView } from '@/contexts/order';

export function marginHint(
    margin: MarginView | null | undefined,
    currency: Currency,
): string {
    if (!margin) return '—';

    const cost = `себестоимость ${fmtMoney(margin.costAmount, currency)}`;

    if (margin.itemsWithoutCost === 0) return cost;

    const positions = pluralRu(margin.itemsWithoutCost, [
        'позиция',
        'позиции',
        'позиций',
    ]);

    return `${cost}; ${margin.itemsWithoutCost} ${positions} без закупочной цены`;
}
