import { EMPLOYEE_KIND_LABEL } from '@/shared/labels/team';
import { cn } from '@/shared/lib/utils';
import { EmployeeKind } from '@/contexts/employeeAssignment';
import { Badge } from '@/ui/Base';

const KIND_CLASS: Record<EmployeeKind, string> = {
    [EmployeeKind.SPECIALIST]:
        'bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-200',
    [EmployeeKind.COURIER]: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-200',
};

interface KindBadgeProps {
    kind: EmployeeKind;
    className?: string;
}

export const KindBadge = ({ kind, className }: KindBadgeProps) => (
    <Badge
        variant="secondary"
        className={cn(KIND_CLASS[kind], className)}
    >
        {EMPLOYEE_KIND_LABEL[kind]}
    </Badge>
);
