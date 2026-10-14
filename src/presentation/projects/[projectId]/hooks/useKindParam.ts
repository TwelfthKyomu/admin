'use client';

import { EmployeeKind } from '@/contexts/employeeAssignment';
import { parseAsStringLiteral, useQueryState } from 'nuqs';

const KIND_FILTER_VALUES = [
    'all',
    EmployeeKind.SPECIALIST,
    EmployeeKind.COURIER,
] as const;

export type KindFilterValue = (typeof KIND_FILTER_VALUES)[number];

export function useKindParam() {
    const [kind, setKind] = useQueryState(
        'kind',
        parseAsStringLiteral(KIND_FILTER_VALUES).withDefault('all'),
    );

    return {
        kind,
        setKind: (next: KindFilterValue) =>
            void setKind(next === 'all' ? null : next),
        matches: (value: EmployeeKind) => kind === 'all' || kind === value,
    };
}
