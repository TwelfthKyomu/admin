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

const fmt = (date: DateInput, pattern: string): string => {
    return format(date, pattern, { locale: ru });
};

export const fmtDateTime = (date?: DateInput): string => {
    return date ? fmt(date, 'd MMM, HH:mm') : '—';
};

export const fmtDate = (date?: DateInput): string => {
    return date ? fmt(date, 'd MMM yyyy') : '—';
};

export const fmtDateFull = (date?: DateInput): string => {
    return date ? fmt(date, 'd MMM yyyy, HH:mm') : '—';
};

export const fmtTime = (date: DateInput): string => {
    return fmt(date, 'HH:mm');
};

export const fmtTimeRange = (start: DateInput, end: DateInput): string => {
    return `${fmtTime(start)}–${fmtTime(end)}`;
};

export const fmtMinutesOfDay = (minutes: number): string => {
    return fmtTime(addMinutes(startOfDay(new Date()), minutes));
};

export const fmtDur = (mins: number): string => {
    if (mins < 60) return `${mins}м`;

    const hours = Math.floor(mins / 60);
    const minutes = mins % 60;

    return minutes ? `${hours}ч ${minutes}м` : `${hours}ч`;
};

export const fmtDateRu = (date: Date): string => {
    return fmt(date, 'EEEE, d MMMM');
};

export const fmtDateShort = (date: Date): string => {
    return fmt(date, 'd MMM');
};

export const fmtWeekdayDate = (date: Date): string => {
    return fmt(date, 'EEEEEE, d MMM');
};

export const fmtMonth = (date: Date): string => {
    return fmt(date, 'LLLL yyyy');
};

export const fmtDayLabel = (date: Date): string => {
    if (isToday(date)) return 'Сегодня';
    if (isYesterday(date)) return 'Вчера';

    return fmt(date, isThisYear(date) ? 'd MMMM' : 'd MMMM yyyy');
};
