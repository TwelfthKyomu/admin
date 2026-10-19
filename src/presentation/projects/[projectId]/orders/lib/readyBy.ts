import { parse } from 'date-fns';

const TIME = 'HH:mm';

export const READY_TIME_DEFAULT = '18:00';

export function readyByOf(
    date: Date | undefined,
    time: string,
): Date | undefined {
    if (!date) return undefined;

    return parse(time || READY_TIME_DEFAULT, TIME, date);
}
