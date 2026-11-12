'use client';

import { EmployeeKind } from '@/contexts/employeeAssignment';
import { type TabItem, Tabs } from '@/ui/Base';
import type { KindFilterValue } from '../hooks/useKindParam';

const KIND_TABS: TabItem<KindFilterValue>[] = [
    { value: 'all', label: 'Все' },
    { value: EmployeeKind.SPECIALIST, label: 'Сотрудники' },
    { value: EmployeeKind.COURIER, label: 'Курьеры' },
];

interface KindFilterProps {
    value: KindFilterValue;
    onChange: (next: KindFilterValue) => void;
}

export const KindFilter = ({ value, onChange }: KindFilterProps) => (
    <Tabs
        items={KIND_TABS}
        value={value}
        onValueChange={onChange}
    />
);
