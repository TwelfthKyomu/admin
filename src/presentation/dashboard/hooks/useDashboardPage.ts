'use client';

import { useState } from 'react';
import { useStaticData } from '@/app/providers';
import { useDashboard, useMyDay, useMySales } from '@/contexts/order';
import { addDays, startOfDay, startOfMonth } from 'date-fns';

export function useDashboardPage() {
    const { projects = [] } = useStaticData();

    const [range] = useState(() => {
        const from = startOfDay(new Date());

        return { from, to: addDays(from, 1) };
    });

    const myDay = useMyDay(range);

    const mySales = useMySales({
        dayFrom: range.from,
        monthFrom: startOfMonth(range.from),
        to: range.to,
    });

    const dashboard = useDashboard();

    const finance =
        dashboard.data?.stats && dashboard.data.projects.length > 0
            ? { stats: dashboard.data.stats, projects: dashboard.data.projects }
            : undefined;

    return {
        today: range.from,
        projectById: new Map(projects.map((project) => [project.id, project])),
        myDay,
        mySales: mySales.data ?? [],
        finance,
    };
}
