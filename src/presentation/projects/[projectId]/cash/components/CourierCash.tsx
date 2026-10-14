import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import type { CourierBalanceView } from '@/contexts/cashShift';
import { Table } from '@/ui/Base';
import { COURIER_COLUMNS } from './Column';

interface CourierCashProps {
    couriers: CourierBalanceView[];
    currency: Currency;
    canAccept: boolean;
    onAccept: (courier: CourierBalanceView) => void;
}

export const CourierCash = ({ couriers, currency, canAccept, onAccept }: CourierCashProps) => (
    <section className="overflow-hidden rounded-xl border border-border">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 text-[13px] font-semibold">
            На руках у курьеров
            <span className="text-amber-700 tabular-nums">
                {fmtMoney(
                    couriers.reduce((sum, row) => sum + row.onHand, 0),
                    currency,
                )}
            </span>
        </header>
        <Table
            columns={COURIER_COLUMNS({ currency, canAccept, onAccept })}
            data={couriers}
            emptyMessage="Курьеры не принимали наличные."
            getRowId={(row) => row.employeeId}
        />
    </section>
);
