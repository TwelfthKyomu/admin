import type { Option } from '@/shared/types';
import type { ProjectEmployeeView } from '@/contexts/employeeAssignment';

type SellerEmployee = Pick<ProjectEmployeeView, 'employeeId' | 'name'>;

export const ALL_SELLERS = 'all';

export const sellerOptions = (employees: SellerEmployee[]): Option[] => {
    return employees.map(({ employeeId, name }) => ({
        value: employeeId,
        label: name,
    }));
};

export const sellerFilterOptions = (employees: SellerEmployee[]): Option[] => {
    return [
        { value: ALL_SELLERS, label: 'Все продавцы' },
        ...sellerOptions(employees),
    ];
};

export const sellerNamesById = (
    employees: SellerEmployee[],
): Map<string, string> => {
    return new Map(employees.map(({ employeeId, name }) => [employeeId, name]));
};

export const sellerLabel = (
    sellerId: string | undefined,
    names: Map<string, string>,
): string => {
    if (!sellerId) return '—';

    return names.get(sellerId) ?? 'Не в проекте';
};
