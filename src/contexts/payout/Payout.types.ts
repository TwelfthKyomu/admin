import type { EmployeeKind } from '@/contexts/employeeAssignment/EmployeeAssignment.types';
import type { PayoutRecord } from './Payouts.table';

export interface PayoutInputs {
    shiftsCount: number;
    shiftRateAmount: number;
    storeRevenue: number;
    commissionRate: number;
    siteRevenue: number;
    siteCommissionRate: number;
    deliveriesCount: number;
    deliveryRateAmount: number;
}

export interface PayoutAmounts {
    shiftsPay: number;
    commissionPay: number;
    siteCommissionPay: number;
    deliveriesPay: number;
    totalAmount: number;
}

export function commissionOf(revenue: number, rate: number): number {
    return Math.floor((revenue * rate) / 100);
}

export function calcPayout(inputs: PayoutInputs): PayoutAmounts {
    const shiftsPay = inputs.shiftsCount * inputs.shiftRateAmount;

    const commissionPay = commissionOf(
        inputs.storeRevenue,
        inputs.commissionRate,
    );

    const siteCommissionPay = commissionOf(
        inputs.siteRevenue,
        inputs.siteCommissionRate,
    );

    const deliveriesPay = inputs.deliveriesCount * inputs.deliveryRateAmount;

    return {
        shiftsPay,
        commissionPay,
        siteCommissionPay,
        deliveriesPay,
        totalAmount:
            shiftsPay + commissionPay + siteCommissionPay + deliveriesPay,
    };
}

export function isPreSalesSnapshot(
    payout: Pick<PayoutRecord, 'siteCommissionRate'>,
): boolean {
    return payout.siteCommissionRate === null;
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
