'use client';

import { PageHeader, PeriodPicker, QueryBoundary, StatsRow } from '@/shared/components/common';
import { fmtDate } from '@/shared/format/date';
import { Table } from '@/ui/Base';
import { subDays } from 'date-fns';
import { KindFilter } from '../components/KindFilter';
import { COLUMNS } from './components/Column';
import { usePayrollPage } from './hooks/usePayrollPage';

export const PayrollPage = () => {
    const {
        query,
        projectId,
        currency,
        period,
        from,
        to,
        kind,
        setKind,
        rows,
        stats,
        canManage,
        onOpenRates,
    } = usePayrollPage();

    return (
        <>
            <PageHeader
                title="Расчёты"
                description="Мастерам — смены и процент с выручки, курьерам — смены и ставка за каждую доставку."
            />
            <div className="mb-4 flex flex-wrap items-center gap-3">
                <PeriodPicker state={period} />
                <span className="text-[13px] text-muted-foreground">
                    {fmtDate(from)} — {fmtDate(subDays(to, 1))}
                </span>
                <div className="ml-auto">
                    <KindFilter
                        value={kind}
                        onChange={setKind}
                    />
                </div>
            </div>
            <StatsRow items={stats} />
            <QueryBoundary
                query={query}
                errorTitle="Не удалось загрузить расчёты"
            >
                {() => (
                    <Table
                        columns={COLUMNS({ projectId, currency, from, to, canManage, onOpenRates })}
                        data={rows}
                        emptyMessage="Нет активных сотрудников за период."
                        getRowId={(row) => row.employeeId}
                    />
                )}
            </QueryBoundary>
        </>
    );
};
