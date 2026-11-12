import 'server-only';

import { db, type Reader, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import {
    foldPaymentTotals,
    PaymentMethod,
} from '@/contexts/payment/Payment.types';
import { payments } from '@/contexts/payment/Payments.table';
import { users } from '@/contexts/user/Users.table';
import { and, asc, eq, inArray, isNotNull, isNull, sum } from 'drizzle-orm';
import type { CourierBalanceView } from './CashShift.types';
import {
    type CashShiftRecord,
    cashShifts,
    courierHandovers,
} from './CashShifts.table';

const openShiftOf = (projectId: string) => {
    return and(
        eq(cashShifts.projectId, projectId),
        isNull(cashShifts.closedAt),
    );
};

export const findOpenCashShift = async (
    projectId: string,
): Promise<CashShiftRecord | null> => {
    const [shift] = await db
        .select()
        .from(cashShifts)
        .where(openShiftOf(projectId))
        .limit(1);

    return shift ?? null;
};

export const lockOpenCashShift = async (
    tx: Tx,
    projectId: string,
    mode: 'share' | 'update',
    missingMessage: string,
): Promise<CashShiftRecord> => {
    const [shift] = await tx
        .select()
        .from(cashShifts)
        .where(openShiftOf(projectId))
        .limit(1)
        .for(mode);

    if (!shift) throw new ApplicationError(missingMessage);

    return shift;
};

export const listCourierBalances = async (
    projectId: string,
    options: { employeeId?: string; executor?: Reader } = {},
): Promise<CourierBalanceView[]> => {
    const executor = options.executor ?? db;

    const [paymentRows, handoverRows] = await Promise.all([
        executor
            .select({
                employeeId: payments.collectedByEmployeeId,
                direction: payments.direction,
                total: sum(payments.amount).mapWith(Number),
            })
            .from(payments)
            .where(
                and(
                    eq(payments.projectId, projectId),
                    eq(payments.method, PaymentMethod.CASH),
                    isNotNull(payments.collectedByEmployeeId),
                    options.employeeId
                        ? eq(payments.collectedByEmployeeId, options.employeeId)
                        : undefined,
                ),
            )
            .groupBy(payments.collectedByEmployeeId, payments.direction),
        executor
            .select({
                employeeId: courierHandovers.employeeId,
                total: sum(courierHandovers.amount).mapWith(Number),
            })
            .from(courierHandovers)
            .where(
                and(
                    eq(courierHandovers.projectId, projectId),
                    options.employeeId
                        ? eq(courierHandovers.employeeId, options.employeeId)
                        : undefined,
                ),
            )
            .groupBy(courierHandovers.employeeId),
    ]);

    const collected = foldPaymentTotals(paymentRows, (row) => row.employeeId);

    const handedOver = new Map(
        handoverRows.map((row) => [row.employeeId, row.total]),
    );

    const employeeIds = [
        ...new Set([...collected.keys(), ...handedOver.keys()]),
    ];

    if (employeeIds.length === 0) return [];

    const names = await executor
        .select({ id: organizationMembers.id, name: users.name })
        .from(organizationMembers)
        .innerJoin(users, eq(users.id, organizationMembers.userId))
        .where(inArray(organizationMembers.id, employeeIds))
        .orderBy(asc(users.name));

    return names.map(({ id, name }) => {
        const totals = collected.get(id) ?? { charged: 0, refunded: 0 };
        const handed = handedOver.get(id) ?? 0;

        return {
            employeeId: id,
            name,
            collected: totals.charged,
            refunded: totals.refunded,
            handedOver: handed,
            onHand: totals.charged - totals.refunded - handed,
        };
    });
};
