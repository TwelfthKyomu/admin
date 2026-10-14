import { Widget, WidgetHeader } from '@/shared/components/common';
import type { DashboardStatsView } from '@/contexts/order';
import type { ProjectView } from '@/contexts/project';
import { Wallet } from 'lucide-react';
import { projectShareRows } from '../lib/shares';
import { dashboardSummary } from '../lib/summary';
import { ProjectShares } from './ProjectShares';

interface SummaryProps {
    stats: DashboardStatsView;
    projects: ProjectView[];
}

export const Summary = ({ stats, projects }: SummaryProps) => {
    const { revenue, facts } = dashboardSummary(stats);

    return (
        <Widget
            padding="lg"
            className="shrink-0 gap-4"
        >
            <WidgetHeader icon={<Wallet className="size-4" />}>
                Выручка — оплачено за вычетом возвратов
            </WidgetHeader>
            <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <span className="font-semibold text-3xl tabular-nums tracking-tight">
                    {revenue}
                </span>
                <span className="text-muted-foreground text-sm">{facts.join(' · ')}</span>
            </div>
            <ProjectShares
                rows={projectShareRows(stats.byProject, projects)}
                currency={stats.totals[0]?.currency}
            />
        </Widget>
    );
};
