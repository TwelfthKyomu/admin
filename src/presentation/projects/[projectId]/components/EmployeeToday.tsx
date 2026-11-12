import type { ProjectEmployeeView } from '@/contexts/employeeAssignment';
import { Badge } from '@/ui/Base';
import { TodayShift } from './TodayShift';

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
