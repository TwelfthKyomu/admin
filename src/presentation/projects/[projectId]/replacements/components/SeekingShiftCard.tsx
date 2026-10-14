import { PersonCell } from '@/shared/components/common';
import type { Currency } from '@/shared/constants/currency';
import { fmtTimeRange } from '@/shared/format/date';
import { fmtMoney } from '@/shared/format/money';
import type { ProjectEmployeeView } from '@/contexts/employeeAssignment';
import type { ReplacementShiftView } from '@/contexts/employeeShift';
import { Badge, Button } from '@/ui/Base';
import { KindBadge } from '../../components/KindBadge';
import { shiftLoadLabel } from '../lib/shifts';

interface SeekingShiftCardProps {
    shift: ReplacementShiftView;
    candidates: ProjectEmployeeView[];
    currency: Currency;
    canAssign: boolean;
    onAssign: (shift: ReplacementShiftView) => void;
}

export const SeekingShiftCard = ({
    shift,
    candidates,
    currency,
    canAssign,
    onAssign,
}: SeekingShiftCardProps) => {
    const startsAt = new Date(shift.startsAt);

    return (
        <article className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-border p-4">
            <div className="grid justify-items-center gap-0.5 rounded-lg border border-border/60 bg-muted/40 py-2">
                <span className="text-[12px] text-muted-foreground">
                    {startsAt.toLocaleDateString('ru-RU', { weekday: 'short' })}
                </span>
                <span className="text-xl font-semibold tabular-nums">{startsAt.getDate()}</span>
                <span className="text-[12px] text-muted-foreground">
                    {startsAt.toLocaleDateString('ru-RU', { month: 'short' })}
                </span>
            </div>

            <div className="grid min-w-0 gap-2">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{shift.employeeName}</span>
                    <KindBadge kind={shift.kind} />
                    <span className="text-[13px] text-muted-foreground tabular-nums">
                        {fmtTimeRange(shift.startsAt, shift.endsAt)}
                    </span>
                    {shift.notes && (
                        <span className="text-[13px] text-muted-foreground">· {shift.notes}</span>
                    )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary">{shiftLoadLabel(shift)}</Badge>
                    {shift.cashDue > 0 && (
                        <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                            {fmtMoney(shift.cashDue, currency)} к получению у двери
                        </Badge>
                    )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                    {candidates.length > 0 ? (
                        <>
                            <span>Свободны в это время:</span>
                            {candidates.map((candidate) => (
                                <span
                                    key={candidate.employeeId}
                                    className="rounded-full border border-border py-0.5 pr-2 pl-1 text-foreground"
                                >
                                    <PersonCell
                                        name={candidate.name}
                                        image={candidate.image}
                                    />
                                </span>
                            ))}
                        </>
                    ) : (
                        <span>Свободных коллег того же вида работы нет</span>
                    )}
                </div>
            </div>

            {canAssign && (
                <Button
                    size="sm"
                    onClick={() => onAssign(shift)}
                    disabled={candidates.length === 0}
                >
                    Назначить замену
                </Button>
            )}
        </article>
    );
};
