'use client';

import { useProject } from '@/app/providers';
import { type StatItem, usePeriodParam } from '@/shared/components/common';
import { fmtMoney } from '@/shared/format/money';
import { modal } from '@/shared/lib/modal';
import { type PayrollRowView, usePayrollPreview } from '@/contexts/payout';
import { Permission } from '@/contexts/user';
import dynamic from 'next/dynamic';
import { useKindParam } from '../../hooks/useKindParam';

const RatesEditSheet = dynamic(() =>
    import('../modal/RatesEditSheet').then((m) => m.RatesEditSheet),
);

export function usePayrollPage() {
    const { projectId, currency, can } = useProject();
    const period = usePeriodParam();
    const { kind, setKind, matches } = useKindParam();
    const { from, to } = period.range;
    const query = usePayrollPreview({ projectId, from, to });

    const rows = (query.data ?? []).filter((row) => matches(row.kind));
    const accrued = rows.reduce((sum, row) => sum + row.totalAmount, 0);
    const paid = rows.reduce((sum, row) => sum + row.paidAmount, 0);

    const stats: StatItem[] = [
        { label: 'Начислено', value: fmtMoney(accrued, currency) },
        { label: 'Выплачено', value: fmtMoney(paid, currency) },
        { label: 'Осталось выплатить', value: fmtMoney(accrued - paid, currency) },
        { label: 'Сотрудников', value: rows.length },
    ];

    const onOpenRates = (row: PayrollRowView) =>
        modal.open(
            <RatesEditSheet
                projectId={projectId}
                row={row}
            />,
        );

    return {
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
        canManage: can(Permission.MANAGE_FINANCES),
        onOpenRates,
    };
}
