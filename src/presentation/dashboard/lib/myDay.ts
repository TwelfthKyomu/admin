import { ROUTES } from '@/shared/constants';
import { ORDER_STATUS_LABEL_SHORT } from '@/shared/labels/order';
import {
    bookingEndsAt,
    type MyDayView,
    type OrderStatus,
} from '@/contexts/order';

interface AgendaBase {
    id: string;
    projectId: string;
    startsAt: Date;
    endsAt: Date;
}

export type AgendaItem =
    | (AgendaBase & { kind: 'shift' })
    | (AgendaBase & {
          kind: 'booking';
          customerName?: string;
          status: OrderStatus;
      });

export function agendaItems(day: MyDayView): AgendaItem[] {
    const shifts = day.shifts.map(
        (shift): AgendaItem => ({
            kind: 'shift',
            id: shift.id,
            projectId: shift.projectId,
            startsAt: new Date(shift.startsAt),
            endsAt: new Date(shift.endsAt),
        }),
    );

    const bookings = day.bookings.flatMap((booking): AgendaItem[] => {
        if (!booking.scheduledAt || !booking.durationMinutes) return [];

        const startsAt = new Date(booking.scheduledAt);

        return [
            {
                kind: 'booking',
                id: booking.id,
                projectId: booking.projectId,
                startsAt,
                endsAt: bookingEndsAt(startsAt, booking.durationMinutes),
                customerName: booking.customerName,
                status: booking.status,
            },
        ];
    });

    return [...shifts, ...bookings].toSorted(
        (a, b) => a.startsAt.getTime() - b.startsAt.getTime(),
    );
}

export type AgendaPhase = 'past' | 'now' | 'next';

export function agendaPhase(item: AgendaItem, now: Date): AgendaPhase {
    if (item.endsAt <= now) return 'past';
    if (item.startsAt <= now) return 'now';

    return 'next';
}

export function agendaTitle(item: AgendaItem): string {
    if (item.kind === 'shift') return 'Смена';

    return item.customerName ?? 'Без имени';
}

export function agendaNote(item: AgendaItem, phase: AgendaPhase): string {
    if (phase === 'now') return 'сейчас';
    if (item.kind === 'shift') return '';

    return ORDER_STATUS_LABEL_SHORT[item.status];
}

export function agendaHref(item: AgendaItem): string {
    if (item.kind === 'shift')
        return ROUTES.project(item.projectId, 'schedule');

    return ROUTES.project(item.projectId, 'orders', item.id);
}

export function isOverdue(dueAt: Date | undefined, today: Date): boolean {
    return dueAt !== undefined && new Date(dueAt) < today;
}
