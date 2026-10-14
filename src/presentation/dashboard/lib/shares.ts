import type { Currency } from '@/shared/constants/currency';
import type { ProjectRevenueView, TopOrderItemView } from '@/contexts/order';
import type { ProjectView } from '@/contexts/project';

export interface ProjectShareRow {
    projectId: string;
    name: string;
    color?: string;
    currency: Currency;
    revenueAmount: number;
    share: number;
}

export interface TopItemRow extends TopOrderItemView {
    share: number;
}

export function projectShareRows(
    byProject: ProjectRevenueView[],
    projects: ProjectView[],
): ProjectShareRow[] {
    const projectById = new Map(
        projects.map((project) => [project.id, project]),
    );

    const totalByCurrency = new Map<Currency, number>();

    for (const row of byProject) {
        totalByCurrency.set(
            row.currency,
            (totalByCurrency.get(row.currency) ?? 0) +
                Math.max(row.revenueAmount, 0),
        );
    }

    return [...byProject]
        .sort((a, b) => b.revenueAmount - a.revenueAmount)
        .map((row) => {
            const project = projectById.get(row.projectId);
            const total = totalByCurrency.get(row.currency) ?? 0;

            return {
                projectId: row.projectId,
                name: project?.name ?? 'Проект',
                color: project?.color,
                currency: row.currency,
                revenueAmount: row.revenueAmount,
                share:
                    total > 0
                        ? Math.round(
                              (Math.max(row.revenueAmount, 0) / total) * 100,
                          )
                        : 0,
            };
        });
}

export function topItemRows(items: TopOrderItemView[]): TopItemRow[] {
    const peakByCurrency = new Map<Currency, number>();

    for (const item of items) {
        peakByCurrency.set(
            item.currency,
            Math.max(
                peakByCurrency.get(item.currency) ?? 0,
                item.revenueAmount,
            ),
        );
    }

    return items.map((item) => {
        const peak = peakByCurrency.get(item.currency) ?? 0;

        return {
            ...item,
            share: peak > 0 ? Math.round((item.revenueAmount / peak) * 100) : 0,
        };
    });
}
