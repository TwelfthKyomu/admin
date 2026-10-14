import type { Option } from '@/shared/types';
import type { ProjectEmployeeView } from '@/contexts/employeeAssignment';

export function employeeOptions(
    employees: Pick<ProjectEmployeeView, 'employeeId' | 'name'>[],
): Option[] {
    return employees.map(({ employeeId, name }) => ({
        value: employeeId,
        label: name,
    }));
}
