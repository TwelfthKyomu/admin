import { fmtMoney } from '@/shared/format/money';
import type { OrderItemView, OrderView } from '@/contexts/order';
import { DetailRow } from './DetailRow';
import { Section } from './Section';

interface ItemsSectionProps {
    order: OrderView;
    items: OrderItemView[];
}

export const ItemsSection = ({ order, items }: ItemsSectionProps) => (
    <Section title="Позиции">
        {items.length === 0 && (
            <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">Позиций нет.</p>
        )}
        <div className="divide-y divide-border">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3"
                >
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium">{item.name}</div>
                        <div className="text-[11px] tabular-nums text-muted-foreground">
                            {fmtMoney(item.unitPriceAmount, order.currency)} × {item.quantity}
                            {item.durationMinutes ? ` · ${item.durationMinutes} мин` : ''}
                        </div>
                    </div>
                    <div className="text-[13px] font-semibold tabular-nums">
                        {fmtMoney(item.totalAmount, order.currency)}
                    </div>
                </div>
            ))}
        </div>
        <footer className="flex flex-col gap-1.5 border-t border-border px-4 py-3 text-[13px]">
            <DetailRow
                label="Подытог"
                value={fmtMoney(order.subtotalAmount, order.currency)}
            />
            {order.discountAmount > 0 && (
                <DetailRow
                    label="Скидка"
                    value={`−${fmtMoney(order.discountAmount, order.currency)}`}
                    dim
                />
            )}
            <DetailRow
                label="Итого"
                value={fmtMoney(order.totalAmount, order.currency)}
                strong
            />
        </footer>
    </Section>
);
