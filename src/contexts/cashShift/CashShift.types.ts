import type { PaymentMethod } from '@/contexts/payment/Payment.types';
import type { CashShiftRecord } from './CashShifts.table';

export const CASH_SHIFT_HISTORY_SIZE = 5;

export interface CashRegisterView {
    shift: CashShiftRecord | null;
    openedByName: string | null;
    totals: CashShiftTotalsView | null;
    paymentsByMethod: PaymentMethodTotalView[];
    movements: CashMovementView[];
    couriers: CourierBalanceView[];
    history: ClosedCashShiftView[];
}

export interface PaymentMethodTotalView {
    method: PaymentMethod | null;
    atCourier: boolean;
    chargeAmount: number;
    refundAmount: number;
}

export interface CourierBalanceView {
    employeeId: string;
    name: string;
    collected: number;
    refunded: number;
    handedOver: number;
    onHand: number;
}

export const CashMovementKind = {
    OPENING: 'opening',
    HANDOVER: 'handover',
    COLLECTION: 'collection',
    REFUND: 'refund',
} as const;

export type CashMovementKind =
    (typeof CashMovementKind)[keyof typeof CashMovementKind];

export interface CashMovementView {
    id: string;
    kind: CashMovementKind;
    at: Date;
    amount: number;
    note: string | null;
}

export interface CashShiftTotalsView {
    openingAmount: number;
    registerCharges: number;
    registerRefunds: number;
    handovers: number;
    collections: number;
    expectedCash: number;
}

export interface ClosedCashShiftView {
    id: string;
    openedAt: Date;
    closedAt: Date | null;
    cashierName: string | null;
    expectedCash: number;
    difference: number;
    note: string | null;
}

export function expectedCashOf(
    totals: Omit<CashShiftTotalsView, 'expectedCash'>,
): number {
    return (
        totals.openingAmount +
        totals.registerCharges -
        totals.registerRefunds +
        totals.handovers -
        totals.collections
    );
}
