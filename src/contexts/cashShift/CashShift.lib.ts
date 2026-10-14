import 'server-only';

import { db, type Reader, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import {
    foldPaymentTotals,
    PaymentDirection,
    PaymentMethod,
} from '@/contexts/payment/Payment.types';
import { payments } from '@/contexts/payment/Payments.table';
import { users } from '@/contexts/user/Users.table';
import {
    and,
    asc,
    desc,
    eq,
    gte,
    inArray,
    isNotNull,
    isNull,
    lte,
    sum,
} from 'drizzle-orm';
import {
    CASH_SHIFT_HISTORY_SIZE,
    CashMovementKind,
    type CashMovementView,
    type CashRegisterView,
    type CashShiftTotalsView,
    type ClosedCashShiftView,
    type CourierBalanceView,
    expectedCashOf,
    type PaymentMethodTotalView,
} from './CashShift.types';
import {
    type CashShiftRecord,
    cashCollections,
    cashShifts,
    courierHandovers,
} from './CashShifts.table';

function openShiftOf(projectId: string) {
    return and(
        eq(cashShifts.projectId, projectId),
        isNull(cashShifts.closedAt),
    );
}

export async function findOpenCashShift(
    projectId: string,
): Promise<CashShiftRecord | null> {
    const [shift] = await db
        .select()
        .from(cashShifts)
        .where(openShiftOf(projectId))
        .limit(1);

    return shift ?? null;
}

export async function lockOpenCashShift(
    tx: Tx,
    projectId: string,
    mode: 'share' | 'update',
    missingMessage: string,
): Promise<CashShiftRecord> {
    const [shift] = await tx
        .select()
        .from(cashShifts)
        .where(openShiftOf(projectId))
        .limit(1)
        .for(mode);

    if (!shift) throw new ApplicationError(missingMessage);

    return shift;
}

async function summarizeCashShifts(
    shifts: CashShiftRecord[],
): Promise<Map<string, CashShiftTotalsView>> {
    if (shifts.length === 0) return new Map();

    const ids = shifts.map((shift) => shift.id);

    const [registerRows, handoverRows, collectionRows] = await Promise.all([
        db
            .select({
                shiftId: payments.cashShiftId,
                direction: payments.direction,
                total: sum(payments.amount).mapWith(Number),
            })
            .from(payments)
            .where(inArray(payments.cashShiftId, ids))
            .groupBy(payments.cashShiftId, payments.direction),
        db
            .select({
                shiftId: courierHandovers.cashShiftId,
                total: sum(courierHandovers.amount).mapWith(Number),
            })
            .from(courierHandovers)
            .where(inArray(courierHandovers.cashShiftId, ids))
            .groupBy(courierHandovers.cashShiftId),
        db
            .select({
                shiftId: cashCollections.cashShiftId,
                total: sum(cashCollections.amount).mapWith(Number),
            })
            .from(cashCollections)
            .where(inArray(cashCollections.cashShiftId, ids))
            .groupBy(cashCollections.cashShiftId),
    ]);

    const register = foldPaymentTotals(registerRows, (row) => row.shiftId);

    const handovers = new Map(
        handoverRows.map((row) => [row.shiftId, row.total]),
    );

    const collections = new Map(
        collectionRows.map((row) => [row.shiftId, row.total]),
    );

    return new Map(
        shifts.map((shift) => {
            const totals = {
                openingAmount: shift.openingAmount,
                registerCharges: register.get(shift.id)?.charged ?? 0,
                registerRefunds: register.get(shift.id)?.refunded ?? 0,
                handovers: handovers.get(shift.id) ?? 0,
                collections: collections.get(shift.id) ?? 0,
            };

            return [
                shift.id,
                { ...totals, expectedCash: expectedCashOf(totals) },
            ];
        }),
    );
}

async function paymentsBreakdown(
    shift: CashShiftRecord,
): Promise<PaymentMethodTotalView[]> {
    const rows = await db
        .select({
            method: payments.method,
            collectedBy: payments.collectedByEmployeeId,
            direction: payments.direction,
            total: sum(payments.amount).mapWith(Number),
        })
        .from(payments)
        .where(
            and(
                eq(payments.projectId, shift.projectId),
                gte(payments.occurredAt, shift.createdAt),
                lte(payments.occurredAt, shift.closedAt ?? new Date()),
            ),
        )
        .groupBy(
            payments.method,
            payments.collectedByEmployeeId,
            payments.direction,
        );

    const byKey = new Map<string, PaymentMethodTotalView>();

    for (const row of rows) {
        const atCourier = row.collectedBy !== null;
        const key = `${row.method}:${atCourier}`;

        const current = byKey.get(key) ?? {
            method: row.method,
            atCourier,
            chargeAmount: 0,
            refundAmount: 0,
        };

        if (row.direction === PaymentDirection.CHARGE) {
            current.chargeAmount += row.total;
        } else {
            current.refundAmount += row.total;
        }

        byKey.set(key, current);
    }

    return [...byKey.values()];
}

async function shiftMovements(
    shift: CashShiftRecord,
): Promise<CashMovementView[]> {
    const [handovers, collections, refunds] = await Promise.all([
        db
            .select({
                id: courierHandovers.id,
                at: courierHandovers.occurredAt,
                amount: courierHandovers.amount,
                note: users.name,
            })
            .from(courierHandovers)
            .leftJoin(
                organizationMembers,
                eq(organizationMembers.id, courierHandovers.employeeId),
            )
            .leftJoin(users, eq(users.id, organizationMembers.userId))
            .where(eq(courierHandovers.cashShiftId, shift.id)),
        db
            .select({
                id: cashCollections.id,
                at: cashCollections.occurredAt,
                amount: cashCollections.amount,
                note: cashCollections.note,
            })
            .from(cashCollections)
            .where(eq(cashCollections.cashShiftId, shift.id)),
        db
            .select({
                id: payments.id,
                at: payments.occurredAt,
                amount: payments.amount,
                note: payments.reason,
            })
            .from(payments)
            .where(
                and(
                    eq(payments.cashShiftId, shift.id),
                    eq(payments.direction, PaymentDirection.REFUND),
                ),
            ),
    ]);

    const movements: CashMovementView[] = [
        {
            id: `${shift.id}:opening`,
            kind: CashMovementKind.OPENING,
            at: shift.createdAt,
            amount: shift.openingAmount,
            note: null,
        },
        ...handovers.map((row) => ({
            ...row,
            kind: CashMovementKind.HANDOVER,
        })),
        ...collections.map((row) => ({
            ...row,
            kind: CashMovementKind.COLLECTION,
            amount: -row.amount,
        })),
        ...refunds.map((row) => ({
            ...row,
            kind: CashMovementKind.REFUND,
            amount: -row.amount,
        })),
    ];

    return movements.sort((a, b) => a.at.getTime() - b.at.getTime());
}

async function closedShiftsHistory(
    projectId: string,
): Promise<ClosedCashShiftView[]> {
    const rows = await db
        .select({ shift: cashShifts, cashierName: users.name })
        .from(cashShifts)
        .leftJoin(users, eq(users.id, cashShifts.openedBy))
        .where(
            and(
                eq(cashShifts.projectId, projectId),
                isNotNull(cashShifts.closedAt),
            ),
        )
        .orderBy(desc(cashShifts.closedAt))
        .limit(CASH_SHIFT_HISTORY_SIZE);

    const totals = await summarizeCashShifts(rows.map((row) => row.shift));

    return rows.map(({ shift, cashierName }) => {
        const expectedCash = totals.get(shift.id)?.expectedCash ?? 0;

        return {
            id: shift.id,
            openedAt: shift.createdAt,
            closedAt: shift.closedAt,
            cashierName,
            expectedCash,
            difference: (shift.closingCountedAmount ?? 0) - expectedCash,
            note: shift.closingNote,
        };
    });
}

export async function loadCashRegister(
    projectId: string,
): Promise<CashRegisterView> {
    const [shift, couriers, history] = await Promise.all([
        findOpenCashShift(projectId),
        listCourierBalances(projectId),
        closedShiftsHistory(projectId),
    ]);

    if (!shift) {
        return {
            shift: null,
            openedByName: null,
            totals: null,
            paymentsByMethod: [],
            movements: [],
            couriers,
            history,
        };
    }

    const [totals, paymentsByMethod, movements, [opener]] = await Promise.all([
        summarizeCashShifts([shift]),
        paymentsBreakdown(shift),
        shiftMovements(shift),
        shift.openedBy
            ? db
                  .select({ name: users.name })
                  .from(users)
                  .where(eq(users.id, shift.openedBy))
                  .limit(1)
            : [],
    ]);

    return {
        shift,
        openedByName: opener?.name ?? null,
        totals: totals.get(shift.id) ?? null,
        paymentsByMethod,
        movements,
        couriers,
        history,
    };
}

export async function listCourierBalances(
    projectId: string,
    options: { employeeId?: string; executor?: Reader } = {},
): Promise<CourierBalanceView[]> {
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
}
