import { fmtDateFull } from '@/shared/format/date';
import type { OrderView } from '@/contexts/order';
import { DetailRow } from './DetailRow';
import { Section } from './Section';

export const CustomerSection = ({ order }: { order: OrderView }) => (
    <Section title="Клиент">
        <div className="grid gap-1.5 px-4 py-3 text-[13px]">
            <DetailRow
                label="Имя"
                value={order.customerName ?? '—'}
            />
            <DetailRow
                label="Телефон"
                value={order.customerPhone ?? '—'}
                mono
            />
            <DetailRow
                label="Email"
                value={order.customerEmail ?? '—'}
            />
            {order.scheduledAt && (
                <DetailRow
                    label="Время"
                    value={fmtDateFull(order.scheduledAt)}
                    mono
                />
            )}
            {order.notes && (
                <div className="mt-1 whitespace-pre-line border-t border-border pt-2 text-[12px] text-muted-foreground">
                    {order.notes}
                </div>
            )}
        </div>
    </Section>
);
