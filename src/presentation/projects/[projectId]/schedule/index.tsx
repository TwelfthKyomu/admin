'use client';

import { Content } from './components/Content';
import { Header } from './components/Header';
import { ScheduleProvider } from './components/ScheduleProvider';

export const ScheduleProjectPage = () => (
    <ScheduleProvider>
        <div className="flex min-h-0 flex-1 flex-col gap-3">
            <Header />
            <Content />
        </div>
    </ScheduleProvider>
);
