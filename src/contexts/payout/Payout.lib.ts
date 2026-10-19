import 'server-only';

import type { Reader } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { aggregateDeliveredByCourier } from '@/contexts/delivery/Delivery.lib';
import {
    type EmployeeAssignmentRecord,
    employeeAssignments,
} from '@/contexts/employeeAssignment/EmployeeAssignments.table';
import { aggregateWorkedShiftsByEmployee } from '@/contexts/employeeShift/EmployeeShift.lib';
import { OrderSource } from '@/contexts/order/Order.types';
import { aggregateSellerRevenue } from '@/contexts/order/OrderStats.lib';
import { and, desc, eq, gt, inArray, isNull, lt, lte, or } from 'drizzle-orm';
import type { PayoutInputs } from './Payout.types';
import { type PayoutRecord, payouts } from './Payouts.table';

export interface PayrollActivity {
    shifts: Map<string, number>;
    storeRevenue: Map<string, number>;
    siteRevenue: Map<string, number>;
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

export function findPayoutsCovering(
    executor: Reader,
    input: { projectId: string; employeeIds: string[]; at: Date },
): Promise<PayoutRecord[]> {
    return executor
        .select()
        .from(payouts)
        .where(
            and(
                eq(payouts.projectId, input.projectId),
                inArray(payouts.employeeId, input.employeeIds),
                lte(payouts.periodStart, input.at),
                gt(payouts.periodEnd, input.at),
            ),
        );
}

export async function loadPayrollActivity(
    projectId: string,
    from: Date,
    to: Date,
): Promise<PayrollActivity> {
    const [shifts, sales, delivered] = await Promise.all([
        aggregateWorkedShiftsByEmployee(projectId, from, to),
        aggregateSellerRevenue(projectId, from, to),
        aggregateDeliveredByCourier(projectId, from, to),
    ]);

    const storeRevenue = new Map<string, number>();
    const siteRevenue = new Map<string, number>();

    for (const row of sales) {
        if (!row.sellerId) continue;

        const revenue =
            row.source === OrderSource.STOREFRONT ? siteRevenue : storeRevenue;

        revenue.set(
            row.sellerId,
            (revenue.get(row.sellerId) ?? 0) + row.revenueAmount,
        );
    }

    return {
        shifts: new Map(shifts.map((row) => [row.employeeId, row.count])),
        storeRevenue,
        siteRevenue,
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
        storeRevenue: activity.storeRevenue.get(assignment.employeeId) ?? 0,
        commissionRate: assignment.commissionRate ?? 0,
        siteRevenue: activity.siteRevenue.get(assignment.employeeId) ?? 0,
        siteCommissionRate: assignment.siteCommissionRate ?? 0,
        deliveriesCount: activity.delivered.get(assignment.employeeId) ?? 0,
        deliveryRateAmount: assignment.deliveryRateAmount ?? 0,
    };
}
