'use client';

import { Button, Dropdown } from '@/ui/Base';
import { Users } from 'lucide-react';
import { useScheduleContext } from './ScheduleProvider';

export const EmployeeFilter = () => {
    const { workingEmployees, employeeFilter, toggleEmployeeFilter, clearEmployeeFilter } =
        useScheduleContext();

    if (workingEmployees.length === 0) return null;

    const active = employeeFilter.size;

    return (
        <Dropdown
            align="end"
            trigger={
                <Button
                    variant={active > 0 ? 'default' : 'outline'}
                    size="sm"
                >
                    <Users size={16} />
                    {active > 0 ? `Сотрудники: ${active}` : 'Сотрудники'}
                </Button>
            }
        >
            <Dropdown.Item
                onSelect={(event) => {
                    event.preventDefault();
                    clearEmployeeFilter();
                }}
            >
                Все сотрудники
            </Dropdown.Item>
            <Dropdown.Separator />
            {workingEmployees.map((employee) => (
                <Dropdown.CheckboxItem
                    key={employee.employeeId}
                    checked={employeeFilter.has(employee.employeeId)}
                    onSelect={(event) => event.preventDefault()}
                    onCheckedChange={() => toggleEmployeeFilter(employee.employeeId)}
                >
                    {employee.name}
                </Dropdown.CheckboxItem>
            ))}
        </Dropdown>
    );
};
