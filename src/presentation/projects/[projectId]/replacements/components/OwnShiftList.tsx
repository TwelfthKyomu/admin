import { PageLoader } from '@/shared/components/common';
import { fmtDateShort, fmtTimeRange } from '@/shared/format/date';
import { Checkbox } from '@/ui/Base';
import type { OwnShiftRow } from '../hooks/useReplacementsPage';

interface OwnShiftListProps {
    shifts: OwnShiftRow[];
    showOwners: boolean;
    isLoading: boolean;
    isPending: boolean;
    onToggle: (shift: OwnShiftRow) => void;
}

export const OwnShiftList = ({
    shifts,
    showOwners,
    isLoading,
    isPending,
    onToggle,
}: OwnShiftListProps) => {
    if (isLoading) return <PageLoader className="py-4" />;

    if (shifts.length === 0) {
        return <p className="text-[13px] text-muted-foreground">Будущих смен нет.</p>;
    }

    return (
        <ul className="-mr-2 grid min-h-0 gap-2.5 overflow-y-auto pr-2">
            {shifts.map((shift) => (
                <li
                    key={shift.id}
                    className="flex items-center justify-between gap-3 border-t border-border pt-2.5"
                >
                    <span className="grid gap-0.5">
                        <span className="text-[13px] font-medium">
                            {fmtDateShort(new Date(shift.startsAt))}
                            {showOwners && ` · ${shift.employeeName}`}
                        </span>
                        <span className="text-[12px] text-muted-foreground tabular-nums">
                            {fmtTimeRange(shift.startsAt, shift.endsAt)}
                        </span>
                    </span>
                    <span className="flex items-center gap-2 text-[12px]">
                        Ищу замену
                        <Checkbox
                            aria-label="Ищу замену"
                            checked={shift.seekingReplacement}
                            disabled={isPending}
                            onCheckedChange={() => onToggle(shift)}
                        />
                    </span>
                </li>
            ))}
        </ul>
    );
};
