'use client';

import { useProjectEmployees } from '@/contexts/employeeAssignment';
import { useShiftsList } from '@/contexts/employeeShift';
import { OrderType, useOrdersList } from '@/contexts/order';

interface UseScheduleDataOptions {
    projectId: string;
    from: Date;
    to: Date;
}

export function useScheduleData({
    projectId,
    from,
    to,
}: UseScheduleDataOptions) {
    const employeesQuery = useProjectEmployees({ projectId });
    const shiftsQuery = useShiftsList({ projectId, from, to });

    const ordersQuery = useOrdersList({
        projectId,
        types: [OrderType.BOOKING],
        from,
        to,
    });

    const isLoading =
        employeesQuery.isFetching ||
        shiftsQuery.isFetching ||
        ordersQuery.isFetching;

    return {
        isLoading,
        employees: employeesQuery.data ?? [],
        shifts: shiftsQuery.data ?? [],
        orders: ordersQuery.data ?? [],
    };
}
