import type { StatItem } from '@/shared/components/common';
import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import type { CashShiftTotalsView } from '@/contexts/cashShift';

export const cashStats = (
    totals: CashShiftTotalsView,
    currency: Currency,
): StatItem[] => [
    {
        label: 'Начальная сумма',
        value: fmtMoney(totals.openingAmount, currency),
    },
    {
        label: 'Наличные в кассе',
        value: `+${fmtMoney(totals.registerCharges, currency)}`,
    },
    {
        label: 'Сдано курьерами',
        value: `+${fmtMoney(totals.handovers, currency)}`,
    },
    {
        label: 'Инкассации и возвраты',
        value: `−${fmtMoney(totals.collections + totals.registerRefunds, currency)}`,
    },
    {
        label: 'Ожидается в кассе',
        value: fmtMoney(totals.expectedCash, currency),
    },
];
