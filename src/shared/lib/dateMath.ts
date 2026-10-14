import { differenceInMinutes, startOfDay } from 'date-fns';

export function minutesIntoDay(date: Date): number {
    return differenceInMinutes(date, startOfDay(date));
}
