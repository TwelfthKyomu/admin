import type { Currency } from '@/shared/constants/currency';
import type { EmployeeKind, ProjectEmployeeRatesView } from '@/contexts/employeeAssignment';
import { ratesSummary } from '../lib/ratesSummary';

interface RatesCellProps {
    kind: EmployeeKind;
    rates?: ProjectEmployeeRatesView;
    currency: Currency;
}

export const RatesCell = ({ kind, rates, currency }: RatesCellProps) => {
    if (!rates) return <span className="text-muted-foreground">—</span>;

    const { perShift, extra } = ratesSummary(kind, rates, currency);

    return (
        <div className="grid gap-0.5 tabular-nums">
            <span className="text-[13px]">{perShift}</span>
            <span className="text-[12px] text-muted-foreground">{extra}</span>
        </div>
    );
};
