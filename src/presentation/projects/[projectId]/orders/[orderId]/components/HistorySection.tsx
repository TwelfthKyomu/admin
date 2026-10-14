import type { Currency } from '@/shared/constants/currency';
import { fmtDateFull } from '@/shared/format/date';
import { ORDER_EVENT_LABEL } from '@/shared/labels/order';
import type { OrderEventView } from '@/contexts/order';
import { eventDetail } from '../lib/eventDetail';
import { Section } from './Section';

interface HistorySectionProps {
    events: OrderEventView[];
    currency: Currency;
}

export const HistorySection = ({ events, currency }: HistorySectionProps) => {
    const sorted = [...events].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return (
        <Section
            title="История"
            className="self-start lg:sticky lg:top-4"
        >
            {sorted.length === 0 && (
                <p className="px-4 py-6 text-center text-[13px] text-muted-foreground">
                    Событий пока нет.
                </p>
            )}
            <ol>
                {sorted.map((event, index) => (
                    <li
                        key={event.id}
                        className="flex gap-3 border-b border-border px-4 py-3 last:border-b-0"
                    >
                        <div className="flex flex-col items-center pt-1">
                            <span className="size-2 shrink-0 rounded-full bg-primary" />
                            {index < sorted.length - 1 && (
                                <span className="mt-1 w-px flex-1 bg-border" />
                            )}
                        </div>
                        <div className="grid min-w-0 flex-1 gap-0.5 text-[11px] text-muted-foreground">
                            <span className="text-[13px] font-medium text-foreground">
                                {ORDER_EVENT_LABEL[event.type] ?? event.type}
                            </span>
                            {eventDetail(event, currency)}
                            <span className="tabular-nums">{fmtDateFull(event.createdAt)}</span>
                        </div>
                    </li>
                ))}
            </ol>
        </Section>
    );
};
