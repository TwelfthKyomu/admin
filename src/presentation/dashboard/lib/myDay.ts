import { ROUTES } from '@/shared/constants';
import type { MyDayView } from '@/contexts/order';

export interface AgendaItem {
    id: string;
    projectId: string;
    startsAt: Date;
    endsAt: Date;
}

export function agendaItems(day: MyDayView): AgendaItem[] {
    return day.shifts
        .map((shift) => ({
            id: shift.id,
            projectId: shift.projectId,
            startsAt: new Date(shift.startsAt),
            endsAt: new Date(shift.endsAt),
        }))
        .toSorted((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

export type AgendaPhase = 'past' | 'now' | 'next';

export function agendaPhase(item: AgendaItem, now: Date): AgendaPhase {
    if (item.endsAt <= now) return 'past';
    if (item.startsAt <= now) return 'now';

    return 'next';
}

export function agendaNote(phase: AgendaPhase): string {
    return phase === 'now' ? 'сейчас' : '';
}

export function agendaHref(item: AgendaItem): string {
    return ROUTES.project(item.projectId, 'schedule');
}

export function isOverdue(dueAt: Date | undefined, today: Date): boolean {
    return dueAt !== undefined && new Date(dueAt) < today;
}
