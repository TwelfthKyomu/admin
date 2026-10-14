import {
    addMinutes,
    format,
    isThisYear,
    isToday,
    isYesterday,
    startOfDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';

type DateInput = Date | string;

function fmt(date: DateInput, pattern: string): string {
    return format(date, pattern, { locale: ru });
}

export function fmtDateTime(date?: DateInput): string {
    return date ? fmt(date, 'd MMM, HH:mm') : '—';
}

export function fmtDate(date?: DateInput): string {
    return date ? fmt(date, 'd MMM yyyy') : '—';
}

export function fmtDateFull(date?: DateInput): string {
    return date ? fmt(date, 'd MMM yyyy, HH:mm') : '—';
}

export function fmtTime(date: DateInput): string {
    return fmt(date, 'HH:mm');
}

export function fmtTimeRange(start: DateInput, end: DateInput): string {
    return `${fmtTime(start)}–${fmtTime(end)}`;
}

export function fmtMinutesOfDay(minutes: number): string {
    return fmtTime(addMinutes(startOfDay(new Date()), minutes));
}

export function fmtDur(mins: number): string {
    if (mins < 60) return `${mins}м`;

    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;

    return minutes ? `${hours}ч ${minutes}м` : `${hours}ч`;
}

export function fmtDateRu(date: Date): string {
    return fmt(date, 'EEEE, d MMMM');
}

export function fmtDateShort(date: Date): string {
    return fmt(date, 'd MMM');
}

export function fmtWeekdayDate(date: Date): string {
    return fmt(date, 'EEEEEE, d MMM');
}

export function fmtMonth(date: Date): string {
    return fmt(date, 'LLLL yyyy');
}

export function fmtDayLabel(date: Date): string {
    if (isToday(date)) return 'Сегодня';
    if (isYesterday(date)) return 'Вчера';

    return fmt(date, isThisYear(date) ? 'd MMMM' : 'd MMMM yyyy');
}
