'use client';

import { CalendarTab } from './CalendarTab';
import { useScheduleContext } from './ScheduleProvider';
import { SchedulerTab } from './SchedulerTab';

export const Content = () => {
    const { tab } = useScheduleContext();

    return tab === 'calendar' ? <CalendarTab /> : <SchedulerTab />;
};
