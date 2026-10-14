'use client';

import { createContext, type ReactNode, useContext } from 'react';
import { type ScheduleState, useScheduleState } from '../hooks/useScheduleState';

const ScheduleContext = createContext<ScheduleState | null>(null);

export const ScheduleProvider = ({ children }: { children: ReactNode }) => (
    <ScheduleContext.Provider value={useScheduleState()}>{children}</ScheduleContext.Provider>
);

export function useScheduleContext(): ScheduleState {
    const context = useContext(ScheduleContext);

    if (!context) throw new Error('useScheduleContext must be used inside <ScheduleProvider>');

    return context;
}
