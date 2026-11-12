import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import {
    EmployeeKind,
    type ProjectEmployeeRatesView,
} from '@/contexts/employeeAssignment';

const courierExtra = (
    rates: ProjectEmployeeRatesView,
    currency: Currency,
): string => {
    return rates.deliveryRateAmount
        ? `${fmtMoney(rates.deliveryRateAmount, currency)} за доставку`
        : 'без оплаты за доставку';
};

const sellerExtra = (rates: ProjectEmployeeRatesView): string => {
    return [
        rates.commissionRate
            ? `продажи ${rates.commissionRate}%`
            : 'без процента с продаж',
        rates.siteCommissionRate
            ? `сайт ${rates.siteCommissionRate}%`
            : undefined,
    ]
        .filter(Boolean)
        .join(', ');
};

export const ratesSummary = (
    kind: EmployeeKind,
    rates: ProjectEmployeeRatesView,
    currency: Currency,
) => ({
    perShift: rates.shiftRateAmount
        ? `${fmtMoney(rates.shiftRateAmount, currency)} за смену`
        : 'без ставки',
    extra:
        kind === EmployeeKind.COURIER
            ? courierExtra(rates, currency)
            : sellerExtra(rates),
});
