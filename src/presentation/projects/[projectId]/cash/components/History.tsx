import type { Currency } from '@/shared/constants/currency';
import { fmtDateShort } from '@/shared/format/date';
import { cn } from '@/shared/lib/utils';
import type { ClosedCashShiftView } from '@/contexts/cashShift';
import { signedMoney } from '../lib/movements';

interface HistoryProps {
    items: ClosedCashShiftView[];
    currency: Currency;
}

export const History = ({ items, currency }: HistoryProps) => (
    <section className="grid gap-0.5 rounded-xl border border-border p-4">
        <span className="mb-2 text-[13px] font-semibold">Прошлые смены</span>
        {items?.map((item) => (
            <div
                key={item.id}
                className="flex items-center justify-between gap-2 border-t border-border py-2 text-[13px]"
            >
                <span className="min-w-0">
                    {fmtDateShort(new Date(item.closedAt ?? item.openedAt))}
                    {item.cashierName && ` · ${item.cashierName}`}
                    {item.note && (
                        <span className="block truncate text-muted-foreground">{item.note}</span>
                    )}
                </span>
                <span
                    className={cn(
                        'font-medium tabular-nums',
                        item.difference === 0 ? 'text-muted-foreground' : 'text-destructive',
                    )}
                >
                    {item.difference === 0 ? 'сошлось' : signedMoney(item.difference, currency)}
                </span>
            </div>
        ))}
    </section>
);
