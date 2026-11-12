import { fmtTime, fmtTimeRange } from '@/shared/format/date';
import type { ProjectEmployeeView } from '@/contexts/employeeAssignment';
import { ShiftStatus } from '@/contexts/employeeShift';
import { Badge } from '@/ui/Base';

export const TodayShift = ({ today }: { today: ProjectEmployeeView['today'] }) => {
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
