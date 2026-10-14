import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import { EmployeeKind } from '@/contexts/employeeAssignment';
import type { PayrollRowView } from '@/contexts/payout';

export function pieceFormula(row: PayrollRowView, currency: Currency): string {
    if (row.kind === EmployeeKind.COURIER) {
        return `${row.deliveriesCount} дост. × ${fmtMoney(row.deliveryRateAmount, currency)}`;
    }

    return `${fmtMoney(row.servicesRevenue, currency)} выручки × ${row.commissionRate}%`;
}
