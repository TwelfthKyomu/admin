'use client';

import { PageLoader } from '@/shared/components/common';
import { fmtTime } from '@/shared/format/date';
import { fmtMoney } from '@/shared/format/money';
import { DeliveryStatus } from '@/contexts/delivery';
import { Button, Tabs } from '@/ui/Base';
import { type CourierTab, useCourierDeliveries } from '../hooks/useCourierDeliveries';
import { deliveryWindowLabel } from '../lib/deliveries';
import { CurrentDeliveryCard } from './CurrentDeliveryCard';
import { PayBadge } from './PayBadge';

const EMPTY_TEXT: Record<CourierTab, string> = {
    now: 'Назначенных доставок нет — загляните в очередь.',
    queue: 'В очереди пусто.',
    done: 'Сегодня пока ничего не закрыто.',
};

export const CourierPanel = () => {
    const {
        currency,
        tab,
        setTab,
        lists,
        me,
        onHand,
        isLoading,
        isBusy,
        onTake,
        onPickUp,
        onDelivered,
        onFailed,
    } = useCourierDeliveries();

    const list = lists[tab];
    const [current, ...rest] = tab === 'now' ? list : [];
    const others = tab === 'now' ? rest : list;
    const today = me?.today;

    return (
        <div className="mx-auto grid w-full max-w-md gap-3.5">
            <div className="grid gap-1">
                <h2 className="text-xl font-semibold">Мои доставки</h2>
                <p className="text-[13px] text-muted-foreground">
                    {today
                        ? `Смена ${fmtTime(new Date(today.startsAt))}–${fmtTime(new Date(today.endsAt))}`
                        : 'Сегодня смены нет'}
                    {' · на руках '}
                    <strong className="text-amber-700 dark:text-amber-300">
                        {fmtMoney(onHand, currency)}
                    </strong>
                </p>
            </div>

            <Tabs<CourierTab>
                items={[
                    { value: 'now', label: `Сейчас · ${lists.now.length}` },
                    { value: 'queue', label: `Очередь · ${lists.queue.length}` },
                    { value: 'done', label: `Готово · ${lists.done.length}` },
                ]}
                value={tab}
                onValueChange={setTab}
                listClassName="w-full"
            />

            {isLoading && <PageLoader />}

            {!isLoading && list.length === 0 && (
                <p className="rounded-xl border border-dashed border-border p-6 text-center text-[13px] text-muted-foreground">
                    {EMPTY_TEXT[tab]}
                </p>
            )}

            {current && (
                <CurrentDeliveryCard
                    delivery={current}
                    isBusy={isBusy}
                    onPickUp={onPickUp}
                    onDelivered={onDelivered}
                    onFailed={onFailed}
                />
            )}

            {tab === 'now' && others.length > 0 && (
                <span className="text-[12px] font-semibold tracking-wide text-muted-foreground uppercase">
                    Следующие
                </span>
            )}

            {others.map((delivery) => (
                <article
                    key={delivery.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"
                >
                    <div className="grid min-w-0 gap-1">
                        <span className="truncate text-[14px] font-medium">
                            {delivery.address ?? 'Адрес не указан'}
                        </span>
                        <span className="flex flex-wrap items-center gap-1.5 text-[12px] text-muted-foreground tabular-nums">
                            {deliveryWindowLabel(delivery)}
                            <PayBadge delivery={delivery} />
                        </span>
                        {delivery.status === DeliveryStatus.FAILED && delivery.failureReason && (
                            <span className="text-[12px] text-destructive">
                                Не доставлено: {delivery.failureReason}
                            </span>
                        )}
                    </div>
                    {tab === 'queue' && (
                        <Button
                            size="sm"
                            className="h-9"
                            disabled={isBusy}
                            onClick={() => onTake(delivery)}
                        >
                            Взять
                        </Button>
                    )}
                    {tab === 'now' && delivery.status === DeliveryStatus.ASSIGNED && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-9"
                            disabled={isBusy}
                            onClick={() => onPickUp(delivery)}
                        >
                            Забрал
                        </Button>
                    )}
                </article>
            ))}
        </div>
    );
};
