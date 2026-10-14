import type { Currency } from '@/shared/constants/currency';
import { fmtTime } from '@/shared/format/date';
import { fmtMoney } from '@/shared/format/money';
import { cn } from '@/shared/lib/utils';
import { CashMovementKind, type CashMovementView } from '@/contexts/cashShift';
import { movementAmountClass, movementText, signedMoney } from '../lib/movements';

interface MovementsProps {
    items: CashMovementView[];
    currency: Currency;
}

export const Movements = ({ items, currency }: MovementsProps) => (
    <section className="grid gap-0.5 rounded-xl border border-border p-4">
        <span className="mb-2 text-[13px] font-semibold">Движения смены</span>
        {items.map((item) => (
            <div
                key={item.id}
                className="grid grid-cols-[3rem_minmax(0,1fr)_auto] gap-2.5 border-t border-border py-2 text-[13px]"
            >
                <span className="text-muted-foreground tabular-nums">
                    {fmtTime(new Date(item.at))}
                </span>
                <span className="truncate">{movementText(item)}</span>
                <span className={cn('font-medium tabular-nums', movementAmountClass(item))}>
                    {item.kind === CashMovementKind.OPENING
                        ? fmtMoney(item.amount, currency)
                        : signedMoney(item.amount, currency)}
                </span>
            </div>
        ))}
    </section>
);
