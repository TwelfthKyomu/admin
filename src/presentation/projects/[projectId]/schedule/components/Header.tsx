'use client';

import { type TabItem, Tabs } from '@/ui/Base';
import type { ScheduleTab } from '../hooks/useScheduleState';
import { Buttons } from './Buttons';
import { useScheduleContext } from './ScheduleProvider';
import { Toolbar } from './Toolbar';

const SCHEDULE_TABS: TabItem<ScheduleTab>[] = [
    { value: 'scheduler', label: 'Расписание' },
    { value: 'calendar', label: 'Календарь' },
];

export const Header = () => {
    const { tab, setTab, builder } = useScheduleContext();

    if (builder.active) {
        return (
            <div className="flex flex-wrap items-center gap-2">
                <Toolbar />
            </div>
        );
    }

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Tabs<ScheduleTab>
                items={SCHEDULE_TABS}
                value={tab}
                onValueChange={setTab}
            />
            <Buttons />
        </div>
    );
};
