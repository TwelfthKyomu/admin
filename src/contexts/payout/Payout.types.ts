import type { EmployeeKind } from '@/contexts/employeeAssignment/EmployeeAssignment.types';
import type { PayoutRecord } from './Payouts.table';

export interface PayoutInputs {
    shiftsCount: number;
    shiftRateAmount: number;
    servicesRevenue: number;
    commissionRate: number;
    deliveriesCount: number;
    deliveryRateAmount: number;
}

export interface PayoutAmounts {
    shiftsPay: number;
    commissionPay: number;
    deliveriesPay: number;
    totalAmount: number;
}

export function calcPayout(inputs: PayoutInputs): PayoutAmounts {
    const shiftsPay = inputs.shiftsCount * inputs.shiftRateAmount;

    const commissionPay = Math.floor(
        (inputs.servicesRevenue * inputs.commissionRate) / 100,
    );

    const deliveriesPay = inputs.deliveriesCount * inputs.deliveryRateAmount;

    return {
        shiftsPay,
        commissionPay,
        deliveriesPay,
        totalAmount: shiftsPay + commissionPay + deliveriesPay,
    };
}

export interface PayrollRowView extends PayoutInputs, PayoutAmounts {
    employeeId: string;
    assignmentId: string;
    employeeName: string;
    position: string;
    kind: EmployeeKind;
    payoutId: string | null;
    paidAt: Date | null;
    paidAmount: number;
    recalculatedTotal: number | null;
}

export function payoutCovers(
    payout: Pick<PayoutRecord, 'periodStart' | 'periodEnd'>,
    at: Date,
): boolean {
    return at >= payout.periodStart && at < payout.periodEnd;
}
