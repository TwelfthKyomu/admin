import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import type { PaymentMethodTotalView } from '@/contexts/cashShift';
import { paymentMethodLabel } from '../lib/paymentMethods';

interface MethodBarsProps {
    rows: PaymentMethodTotalView[];
    currency: Currency;
}

export const MethodBars = ({ rows, currency }: MethodBarsProps) => {
    const items = rows
        .map((row) => ({
            key: `${row.method}:${row.atCourier}`,
            label: paymentMethodLabel(row),
            net: row.chargeAmount - row.refundAmount,
        }))
        .filter((item) => item.net !== 0)
        .sort((a, b) => b.net - a.net);

    const max = Math.max(1, ...items.map((item) => Math.abs(item.net)));

    return (
        <section className="grid gap-3 rounded-xl border border-border p-4">
            <span className="text-[13px] font-semibold">Оплаты за смену по способам</span>
            {items?.map((item) => (
                <div
                    key={item.key}
                    className="grid grid-cols-[10rem_minmax(0,1fr)_7rem] items-center gap-3 text-[13px]"
                >
                    <span>{item.label}</span>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                        <div
                            className="h-2 rounded-full bg-primary"
                            style={{
                                width: `${Math.round((Math.abs(item.net) / max) * 100)}%`,
                            }}
                        />
                    </div>
                    <span className="text-right tabular-nums">{fmtMoney(item.net, currency)}</span>
                </div>
            ))}
        </section>
    );
};
