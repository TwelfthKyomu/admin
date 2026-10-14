import { fmtTime, fmtTimeRange } from '@/shared/format/date';
import type { ProjectEmployeeView } from '@/contexts/employeeAssignment';
import { ShiftStatus } from '@/contexts/employeeShift';
import { Badge } from '@/ui/Base';

const TodayShift = ({ today }: { today: ProjectEmployeeView['today'] }) => {
    if (!today) {
        return <span className="text-[12px] text-muted-foreground">Выходной</span>;
    }

    if (today.status === ShiftStatus.IN_PROGRESS) {
        return <Badge>На смене до {fmtTime(new Date(today.endsAt))}</Badge>;
    }

    if (today.status === ShiftStatus.COMPLETED) {
        return <span className="text-[12px] text-muted-foreground">Смена закончилась</span>;
    }

    return <Badge variant="outline">Смена {fmtTimeRange(today.startsAt, today.endsAt)}</Badge>;
};

export const EmployeeToday = ({ employee }: { employee: ProjectEmployeeView }) => (
    <div className="flex flex-wrap items-center gap-1.5">
        <TodayShift today={employee.today} />
        {employee.seekingShifts > 0 && (
            <Badge className="bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                Ищет замену
            </Badge>
        )}
    </div>
);
