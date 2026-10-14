import { PersonCell } from '@/shared/components/common';
import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import { EmployeeKind } from '@/contexts/employeeAssignment';
import type { PayrollRowView } from '@/contexts/payout';
import { Button } from '@/ui/Base';
import { createColumnHelper } from '@tanstack/react-table';
import { KindBadge } from '../../components/KindBadge';
import { pieceFormula } from '../lib/pieceFormula';
import { PayoutCell } from './PayoutCell';

const { accessor, display } = createColumnHelper<PayrollRowView>();

interface ColumnsProps {
    projectId: string;
    currency: Currency;
    from: Date;
    to: Date;
    canManage: boolean;
    onOpenRates: (row: PayrollRowView) => void;
}

export const COLUMNS = ({
    projectId,
    currency,
    from,
    to,
    canManage,
    onOpenRates,
}: ColumnsProps) => [
    accessor('employeeName', {
        header: 'Сотрудник',
        cell: ({ row: { original } }) => (
            <div className="flex items-center gap-3">
                <PersonCell
                    name={original.employeeName}
                    caption={original.position}
                />
                <KindBadge kind={original.kind} />
            </div>
        ),
    }),
    accessor('shiftsCount', {
        header: 'Смены',
    }),
    display({
        id: 'shiftsPay',
        header: 'За смены',
        cell: ({ row: { original } }) =>
            original.shiftRateAmount > 0 ? fmtMoney(original.shiftsPay, currency) : '—',
    }),
    display({
        id: 'piece',
        header: 'Сдельно',
        cell: ({ row: { original } }) => (
            <div>
                <div>
                    {fmtMoney(
                        original.kind === EmployeeKind.COURIER
                            ? original.deliveriesPay
                            : original.commissionPay,
                        currency,
                    )}
                </div>
                <div>{pieceFormula(original, currency)}</div>
            </div>
        ),
    }),
    accessor('totalAmount', {
        header: 'Итого',
        cell: ({ row: { original } }) => (
            <div className="grid">
                <span>{fmtMoney(original.totalAmount, currency)}</span>
                {original.recalculatedTotal !== undefined && (
                    <span
                        className="text-[11px] text-amber-600"
                        title="Данные изменились после выплаты. Отмените выплату и зафиксируйте заново, если нужно."
                    >
                        сейчас вышло бы {fmtMoney(original.recalculatedTotal, currency)}
                    </span>
                )}
            </div>
        ),
    }),
    display({
        id: 'payout',
        header: 'Выплата',
        cell: ({ row: { original } }) => (
            <PayoutCell
                row={original}
                projectId={projectId}
                from={from}
                to={to}
                canManage={canManage}
            />
        ),
    }),
    display({
        id: 'rates',
        header: '',
        enableSorting: false,
        cell: ({ row: { original } }) =>
            canManage ? (
                <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onOpenRates(original)}
                >
                    Ставки
                </Button>
            ) : null,
    }),
];
