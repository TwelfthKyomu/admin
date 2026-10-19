import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import { EmployeeKind } from '@/contexts/employeeAssignment';
import type { PayrollRowView } from '@/contexts/payout';

export function pieceFormula(row: PayrollRowView, currency: Currency): string {
    if (row.kind === EmployeeKind.COURIER) {
        return `${row.deliveriesCount} дост. × ${fmtMoney(row.deliveryRateAmount, currency)}`;
    }

    const store = `${fmtMoney(row.storeRevenue, currency)} × ${row.commissionRate}%`;

    if (row.siteCommissionRate <= 0) return store;

    return `${store} + сайт ${fmtMoney(row.siteRevenue, currency)} × ${row.siteCommissionRate}%`;
}
