import { fmtTime } from '@/shared/format/date';
import { Badge } from '@/ui/Base';

interface ShiftBadgeProps {
    openedAt?: Date;
    openedByName?: string;
}

export const ShiftBadge = ({ openedAt, openedByName }: ShiftBadgeProps) => {
    if (!openedAt) return <Badge variant="outline">Смена закрыта</Badge>;

    return (
        <Badge className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200">
            Смена открыта с {fmtTime(openedAt)}
            {openedByName && ` · ${openedByName}`}
        </Badge>
    );
};
