import type { Day } from 'date-fns';
import { ru } from 'date-fns/locale';

const MON_FIRST: Day[] = [1, 2, 3, 4, 5, 6, 0];

export const WEEKDAYS_MON_FIRST = MON_FIRST.map((day) => ({
    day,
    label: ru.localize.day(day, { width: 'short' }),
}));
