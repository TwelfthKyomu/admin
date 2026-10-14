import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import { EmployeeKind, type ProjectEmployeeRatesView } from '@/contexts/employeeAssignment';

interface RatesCellProps {
    kind: EmployeeKind;
    rates?: ProjectEmployeeRatesView;
    currency: Currency;
}

export const RatesCell = ({ kind, rates, currency }: RatesCellProps) => {
    if (!rates) return <span className="text-muted-foreground">—</span>;

    const money = (amount: number) => fmtMoney(amount, currency);

    const perShift = rates.shiftRateAmount
        ? `${money(rates.shiftRateAmount)} за смену`
        : 'без ставки';

    let extra = rates.commissionRate ? `комиссия ${rates.commissionRate}%` : 'без комиссии';

    if (kind === EmployeeKind.COURIER) {
        extra = rates.deliveryRateAmount
            ? `${money(rates.deliveryRateAmount)} за доставку`
            : 'без оплаты за доставку';
    }

    return (
        <div className="grid gap-0.5 tabular-nums">
            <span className="text-[13px]">{perShift}</span>
            <span className="text-[12px] text-muted-foreground">{extra}</span>
        </div>
    );
};
