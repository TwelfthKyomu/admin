import { pluralRu } from '@/shared/format/plural';
import { EmployeeKind } from '@/contexts/employeeAssignment';
import type {
    EmployeeShiftView,
    ReplacementShiftView,
} from '@/contexts/employeeShift';

const BOOKINGS: [string, string, string] = ['запись', 'записи', 'записей'];

const DELIVERIES: [string, string, string] = [
    'доставка',
    'доставки',
    'доставок',
];

export function shiftLoadLabel(shift: ReplacementShiftView): string {
    if (shift.kind === EmployeeKind.COURIER) {
        return shift.deliveriesCount > 0
            ? `${shift.deliveriesCount} ${pluralRu(shift.deliveriesCount, DELIVERIES)} в окне`
            : 'доставок пока нет';
    }

    return shift.bookingsCount > 0
        ? `${shift.bookingsCount} ${pluralRu(shift.bookingsCount, BOOKINGS)}`
        : 'записей пока нет';
}

export function overlaps(
    a: Pick<EmployeeShiftView, 'startsAt' | 'endsAt'>,
    b: Pick<EmployeeShiftView, 'startsAt' | 'endsAt'>,
): boolean {
    return (
        new Date(a.startsAt) < new Date(b.endsAt) &&
        new Date(b.startsAt) < new Date(a.endsAt)
    );
}
