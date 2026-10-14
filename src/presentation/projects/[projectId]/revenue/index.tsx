'use client';

import { PageHeader, PeriodPicker, QueryBoundary, StatsRow } from '@/shared/components/common';
import { fmtMoney } from '@/shared/format/money';
import { Table } from '@/ui/Base';
import { KindBadge } from '../components/KindBadge';
import { COURIER_COLUMNS, MASTER_COLUMNS } from './components/Column';
import { useRevenuePage } from './hooks/useRevenuePage';

export const RevenuePage = () => {
    const { period, currency, mastersQuery, couriersQuery, mastersTotal, delivered, stats } =
        useRevenuePage();

    return (
        <>
            <PageHeader
                title="Выручка по сотрудникам"
                description="Мастера — по оплаченным позициям завершённых заказов. Курьеры — по доставкам и деньгам у двери."
                actions={<PeriodPicker state={period} />}
            />
            <StatsRow items={stats} />

            <section className="mb-4 overflow-hidden rounded-xl border border-border">
                <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-[13px]">
                    <KindBadge kind="specialist" />
                    <span className="text-muted-foreground">
                        {fmtMoney(mastersTotal, currency)} за период
                    </span>
                </header>
                <QueryBoundary
                    query={mastersQuery}
                    errorTitle="Не удалось загрузить выручку мастеров"
                >
                    {(masters) => (
                        <Table
                            columns={MASTER_COLUMNS(currency, mastersTotal)}
                            data={masters}
                            emptyMessage="За период нет оплаченных позиций с исполнителем."
                            getRowId={(row) => row.employeeId ?? 'none'}
                        />
                    )}
                </QueryBoundary>
            </section>

            <section className="overflow-hidden rounded-xl border border-border">
                <header className="flex items-center gap-2 border-b border-border px-4 py-3 text-[13px]">
                    <KindBadge kind="courier" />
                    <span className="text-muted-foreground">{delivered} доставок за период</span>
                </header>
                <QueryBoundary
                    query={couriersQuery}
                    errorTitle="Не удалось загрузить статистику курьеров"
                >
                    {(couriers) => (
                        <Table
                            columns={COURIER_COLUMNS(currency)}
                            data={couriers}
                            emptyMessage="За период курьеры ничего не доставляли."
                            getRowId={(row) => row.employeeId}
                        />
                    )}
                </QueryBoundary>
            </section>
        </>
    );
};
