'use client';

import { QueryBoundary, Widget, WidgetHeader } from '@/shared/components/common';
import { fmtDateRu } from '@/shared/format/date';
import { Sun } from 'lucide-react';
import { Agenda } from './components/Agenda';
import { MyDeliveries } from './components/MyDeliveries';
import { MySales } from './components/MySales';
import { MyTasks } from './components/MyTasks';
import { RecentOrders } from './components/RecentOrders';
import { SetupChecklist } from './components/SetupChecklist';
import { Summary } from './components/Summary';
import { TopItems } from './components/TopItems';
import { useDashboardPage } from './hooks/useDashboardPage';
import { useSetupChecklist } from './hooks/useSetupChecklist';
import { agendaItems } from './lib/myDay';

export const DashboardPage = () => {
    const { today, projectById, myDay, mySales, finance } = useDashboardPage();
    const { setups, hide } = useSetupChecklist();

    return (
        <QueryBoundary
            query={myDay}
            errorTitle="Не удалось загрузить главную"
        >
            {(day) => (
                <div className="flex flex-col gap-3">
                    <Widget
                        padding="lg"
                        className="shrink-0 gap-4"
                    >
                        <WidgetHeader icon={<Sun className="size-4" />}>
                            {fmtDateRu(today)}
                        </WidgetHeader>
                    </Widget>
                    {setups.map((setup) => (
                        <SetupChecklist
                            key={setup.projectId}
                            setup={setup}
                            project={projectById.get(setup.projectId)}
                            onHide={hide}
                        />
                    ))}
                    <div className="grid gap-3 lg:grid-cols-2">
                        <Agenda
                            items={agendaItems(day)}
                            projectById={projectById}
                        />
                        <MyTasks
                            tasks={day.tasks}
                            today={today}
                        />
                        {mySales.length > 0 && (
                            <MySales
                                sales={mySales}
                                projectById={projectById}
                            />
                        )}
                        {day.deliveries.length > 0 && (
                            <MyDeliveries
                                deliveries={day.deliveries}
                                projectById={projectById}
                            />
                        )}
                    </div>
                    {finance && (
                        <>
                            <Summary
                                stats={finance.stats}
                                projects={finance.projects}
                            />
                            <div className="grid gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
                                <RecentOrders
                                    orders={finance.stats.recentOrders}
                                    projects={finance.projects}
                                />
                                <TopItems items={finance.stats.topItems} />
                            </div>
                        </>
                    )}
                </div>
            )}
        </QueryBoundary>
    );
};
