import 'server-only';

import type { Reader } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { aggregateDeliveredByCourier } from '@/contexts/delivery/Delivery.lib';
import {
    type EmployeeAssignmentRecord,
    employeeAssignments,
} from '@/contexts/employeeAssignment/EmployeeAssignments.table';
import { aggregateWorkedShiftsByEmployee } from '@/contexts/employeeShift/EmployeeShift.lib';
import { aggregateOrderRevenueByEmployee } from '@/contexts/order/OrderStats.lib';
import { and, desc, eq, gt, isNull, lt, or } from 'drizzle-orm';
import type { PayoutInputs } from './Payout.types';
import { type PayoutRecord, payouts } from './Payouts.table';

export interface PayrollActivity {
    shifts: Map<string, number>;
    revenue: Map<string, number>;
    delivered: Map<string, number>;
}

export function assertPayrollPeriod(from: Date, to: Date): void {
    if (to <= from) {
        throw new ApplicationError(
            'Дата окончания периода должна быть позже даты начала',
        );
    }
}

export async function findPayrollAssignments(
    executor: Reader,
    input: { projectId: string; from: Date; to: Date; employeeId?: string },
): Promise<EmployeeAssignmentRecord[]> {
    const rows = await executor
        .select()
        .from(employeeAssignments)
        .where(
            and(
                eq(employeeAssignments.projectId, input.projectId),
                lt(employeeAssignments.startedAt, input.to),
                or(
                    isNull(employeeAssignments.endedAt),
                    gt(employeeAssignments.endedAt, input.from),
                ),
                input.employeeId
                    ? eq(employeeAssignments.employeeId, input.employeeId)
                    : undefined,
            ),
        )
        .orderBy(desc(employeeAssignments.startedAt));

    const latest = new Map<string, EmployeeAssignmentRecord>();

    for (const row of rows) {
        if (!latest.has(row.employeeId)) latest.set(row.employeeId, row);
    }

    return [...latest.values()];
}

export function findOverlappingPayouts(
    executor: Reader,
    input: { projectId: string; from: Date; to: Date; employeeId?: string },
): Promise<PayoutRecord[]> {
    return executor
        .select()
        .from(payouts)
        .where(
            and(
                eq(payouts.projectId, input.projectId),
                lt(payouts.periodStart, input.to),
                gt(payouts.periodEnd, input.from),
                input.employeeId
                    ? eq(payouts.employeeId, input.employeeId)
                    : undefined,
            ),
        );
}

export async function loadPayrollActivity(
    projectId: string,
    from: Date,
    to: Date,
): Promise<PayrollActivity> {
    const [shifts, revenue, delivered] = await Promise.all([
        aggregateWorkedShiftsByEmployee(projectId, from, to),
        aggregateOrderRevenueByEmployee(projectId, from, to),
        aggregateDeliveredByCourier(projectId, from, to),
    ]);

    return {
        shifts: new Map(shifts.map((row) => [row.employeeId, row.count])),
        revenue: new Map(
            revenue.flatMap((row) =>
                row.employeeId ? [[row.employeeId, row.revenueAmount]] : [],
            ),
        ),
        delivered: new Map(delivered.map((row) => [row.courierId, row.count])),
    };
}

export function payoutInputsOf(
    assignment: EmployeeAssignmentRecord,
    activity: PayrollActivity,
): PayoutInputs {
    return {
        shiftsCount: activity.shifts.get(assignment.employeeId) ?? 0,
        shiftRateAmount: assignment.shiftRateAmount ?? 0,
        servicesRevenue: activity.revenue.get(assignment.employeeId) ?? 0,
        commissionRate: assignment.commissionRate ?? 0,
        deliveriesCount: activity.delivered.get(assignment.employeeId) ?? 0,
        deliveryRateAmount: assignment.deliveryRateAmount ?? 0,
    };
}
