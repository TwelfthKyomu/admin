import { differenceInMinutes, startOfDay } from 'date-fns';

export const minutesIntoDay = (date: Date): number => {
    return differenceInMinutes(date, startOfDay(date));
};
