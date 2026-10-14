'use client';

import { fmtDate } from '@/shared/format/date';
import { runAction } from '@/shared/lib/action-result';
import { type PayrollRowView, useDeletePayout, useRecordPayout } from '@/contexts/payout';
import { Badge, Button } from '@/ui/Base';

interface PayoutCellProps {
    row: PayrollRowView;
    projectId: string;
    from: Date;
    to: Date;
    canManage: boolean;
}

export const PayoutCell = ({ row, projectId, from, to, canManage }: PayoutCellProps) => {
    const record = useRecordPayout(projectId);
    const remove = useDeletePayout(projectId);
    const busy = record.isPending || remove.isPending;
    const { payoutId } = row;

    if (payoutId) {
        return (
            <div className="flex items-center gap-2">
                <Badge variant="outline">
                    Выплачено{row.paidAt ? ` ${fmtDate(row.paidAt)}` : ''}
                </Badge>
                {canManage && (
                    <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() =>
                            runAction(remove.mutateAsync({ projectId, payoutId }), {
                                success: 'Выплата отменена',
                            })
                        }
                    >
                        Отменить
                    </Button>
                )}
            </div>
        );
    }

    if (!canManage) return <span className="text-muted-foreground">Не выплачено</span>;

    return (
        <Button
            size="sm"
            disabled={busy || row.totalAmount === 0}
            onClick={() =>
                runAction(
                    record.mutateAsync({
                        projectId,
                        employeeId: row.employeeId,
                        from,
                        to,
                    }),
                    { success: 'Выплата зафиксирована' },
                )
            }
        >
            Выплатить
        </Button>
    );
};
