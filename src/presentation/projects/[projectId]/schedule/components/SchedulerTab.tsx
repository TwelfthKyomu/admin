'use client';

import { fmtMoney } from '@/shared/format/money';
import { salesTotal } from '@/contexts/order';
import { Scheduler } from '@/ui/Base/Scheduler';
import { EmployeeFilter } from '../components/EmployeeFilter';
import { SaleCard } from '../components/SaleCard';
import { ScheduleFooter } from '../components/ScheduleFooter';
import { useScheduleColumns } from '../hooks/useScheduleColumns';
import { saleMatches } from '../lib/mapToScheduler';
import { useScheduleContext } from './ScheduleProvider';

export const SchedulerTab = () => {
    const { date, setDate, mode, setMode, data, workingEmployees, employeeFilter, currency } =
        useScheduleContext();

    const columns = useScheduleColumns();

    const sales =
        employeeFilter.size === 0
            ? data.sales
            : data.sales.filter((sale) => employeeFilter.has(sale.sellerId));

    return (
        <>
            <Scheduler
                date={date}
                onDateChange={setDate}
                mode={mode}
                onModeChange={setMode}
                items={sales}
                columns={columns}
                renderItem={(ctx) => (
                    <SaleCard
                        key={ctx.item.id}
                        {...ctx}
                    />
                )}
                isDragDisabled={() => true}
                excludeFromConflict={() => true}
                searchPredicate={saleMatches}
                topBarActionsSlot={<EmployeeFilter />}
            />
            <ScheduleFooter
                isLoading={data.isLoading}
                stats={[
                    { label: 'Продаж', value: sales.length },
                    {
                        label: 'Выручка',
                        value: fmtMoney(salesTotal(sales.map((sale) => sale.order)), currency),
                    },
                    { label: 'Сотрудников', value: workingEmployees.length },
                ]}
            />
        </>
    );
};
