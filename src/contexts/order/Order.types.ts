import { ApplicationError } from '@/shared/api/errors';
import type { Currency } from '@/shared/constants/currency';
import { enumValues } from '@/shared/lib/enum';
import type { MyDeliveryView } from '@/contexts/delivery/Delivery.types';
import type { MyShiftView } from '@/contexts/employeeShift/EmployeeShift.types';
import { ProductType } from '@/contexts/product/Product.types';
import type { ProjectRecord } from '@/contexts/project/Projects.table';
import type { StockLine } from '@/contexts/stockMovement/StockMovement.types';
import type { MyTaskView } from '@/contexts/task/Task.types';
import { addMinutes } from 'date-fns';
import type { OrderItemInput } from './Order.schema';
import type { OrderItemRecord, OrderRecord } from './Orders.table';

export const OrderType = {
    BOOKING: 'booking',
    SALE: 'sale',
    MIXED: 'mixed',
} as const;

export type OrderType = (typeof OrderType)[keyof typeof OrderType];

export const ORDER_TYPE_VALUES = enumValues(OrderType);

export const OrderStatus = {
    PENDING: 'pending',
    CONFIRMED: 'confirmed',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
    NO_SHOW: 'no_show',
} as const;

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const ORDER_STATUS_VALUES = enumValues(OrderStatus);

export function isOrderStatus(value: string): value is OrderStatus {
    return ORDER_STATUS_VALUES.some((status) => status === value);
}

export const ORDER_ACTIVE_STATUSES: readonly OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.CONFIRMED,
    OrderStatus.IN_PROGRESS,
];

export const ORDER_CANCELLED_STATUSES: readonly OrderStatus[] = [
    OrderStatus.CANCELLED,
    OrderStatus.NO_SHOW,
];

export const ORDER_TERMINAL_STATUSES: readonly OrderStatus[] = [
    OrderStatus.COMPLETED,
    ...ORDER_CANCELLED_STATUSES,
];

export function isOrderCancelled(status: OrderStatus): boolean {
    return ORDER_CANCELLED_STATUSES.includes(status);
}

export function isOrderTerminal(status: OrderStatus): boolean {
    return ORDER_TERMINAL_STATUSES.includes(status);
}

export function orderRequiresSchedule(type: OrderType): boolean {
    return type !== OrderType.SALE;
}

const ORDER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    [OrderStatus.PENDING]: [
        OrderStatus.CONFIRMED,
        OrderStatus.CANCELLED,
        OrderStatus.NO_SHOW,
    ],
    [OrderStatus.CONFIRMED]: [
        OrderStatus.IN_PROGRESS,
        OrderStatus.COMPLETED,
        OrderStatus.CANCELLED,
        OrderStatus.NO_SHOW,
    ],
    [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    [OrderStatus.COMPLETED]: [],
    [OrderStatus.CANCELLED]: [],
    [OrderStatus.NO_SHOW]: [],
};

export function getNextOrderStatuses(current: OrderStatus): OrderStatus[] {
    return ORDER_STATUS_TRANSITIONS[current];
}

export const PaymentStatus = {
    UNPAID: 'unpaid',
    PARTIAL: 'partial',
    PAID: 'paid',
    REFUNDED: 'refunded',
} as const;

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PAYMENT_STATUS_VALUES = enumValues(PaymentStatus);

export type OrderMoney = Pick<
    OrderRecord,
    'totalAmount' | 'paidAmount' | 'refundedAmount'
>;

export function recomputePaymentStatus(money: OrderMoney): PaymentStatus {
    const net = money.paidAmount - money.refundedAmount;

    if (money.totalAmount === 0 && net === 0) return PaymentStatus.UNPAID;
    if (net <= 0 && money.refundedAmount > 0) return PaymentStatus.REFUNDED;
    if (net <= 0) return PaymentStatus.UNPAID;
    if (net < money.totalAmount) return PaymentStatus.PARTIAL;

    return PaymentStatus.PAID;
}

export function orderAmountDue(money: OrderMoney): number {
    return Math.max(
        0,
        money.totalAmount - (money.paidAmount - money.refundedAmount),
    );
}

export function orderAfterPayment(
    money: OrderMoney,
    amount: number,
): Pick<OrderRecord, 'paidAmount' | 'paymentStatus'> {
    const paidAmount = money.paidAmount + amount;

    if (paidAmount - money.refundedAmount > money.totalAmount) {
        throw new ApplicationError('Платёж превышает сумму заказа');
    }

    return {
        paidAmount,
        paymentStatus: recomputePaymentStatus({ ...money, paidAmount }),
    };
}

export function orderAfterRefund(
    money: OrderMoney,
    amount: number,
): Pick<OrderRecord, 'refundedAmount' | 'paymentStatus'> {
    const refundedAmount = money.refundedAmount + amount;

    if (refundedAmount > money.paidAmount) {
        throw new ApplicationError('Возврат превышает оплаченную сумму');
    }

    return {
        refundedAmount,
        paymentStatus: recomputePaymentStatus({ ...money, refundedAmount }),
    };
}

function orderNetPaid(money: OrderMoney): number {
    return Math.max(money.paidAmount - money.refundedAmount, 0);
}

export function paidShareOf(
    item: Pick<OrderItemRecord, 'totalAmount'>,
    order: OrderMoney & Pick<OrderRecord, 'subtotalAmount'>,
): number {
    if (order.subtotalAmount === 0) return 0;

    const paid = Math.min(orderNetPaid(order), order.totalAmount);

    return (item.totalAmount * paid) / order.subtotalAmount;
}

export function orderItemTotal(
    item: Pick<OrderItemInput, 'unitPriceAmount' | 'quantity'>,
): number {
    return item.unitPriceAmount * item.quantity;
}

export function sumOrderItems(items: OrderItemInput[]): number {
    return items.reduce((sum, item) => sum + orderItemTotal(item), 0);
}

export function inferDurationMinutes(items: OrderItemInput[]): number | null {
    const total = items.reduce(
        (sum, item) =>
            item.type === ProductType.SERVICE && item.durationMinutes
                ? sum + item.durationMinutes * item.quantity
                : sum,
        0,
    );

    return total > 0 ? total : null;
}

export function bookingEndsAt(
    scheduledAt: Date,
    durationMinutes: number,
): Date {
    return addMinutes(scheduledAt, durationMinutes);
}

export function stockLinesFromOrderItems(
    items: Pick<
        OrderItemRecord,
        'productId' | 'variantId' | 'type' | 'quantity'
    >[],
): StockLine[] {
    return items.flatMap((item) =>
        item.productId && item.type !== ProductType.SERVICE
            ? [
                  {
                      productId: item.productId,
                      variantId: item.variantId,
                      quantity: item.quantity,
                  },
              ]
            : [],
    );
}

export const OrderEventType = {
    CREATED: 'created',
    STATUS_CHANGED: 'status_changed',
    DISCOUNT_APPLIED: 'discount_applied',
    PAYMENT_RECORDED: 'payment_recorded',
    REFUND_RECORDED: 'refund_recorded',
    ASSIGNED_EMPLOYEE_CHANGED: 'assigned_employee_changed',
    SCHEDULED_AT_CHANGED: 'scheduled_at_changed',
    SHIPMENT_UPDATED: 'shipment_updated',
} as const;

export type OrderEventType =
    (typeof OrderEventType)[keyof typeof OrderEventType];

export const ORDER_EVENT_TYPE_VALUES = enumValues(OrderEventType);

export const ORDER_ITEMS_MAX = 200;

export const ORDERS_LIST_LIMIT = 500;

export const ORDERS_RANGE_LIMIT = 5000;
export const ORDER_ITEM_QUANTITY_MAX = 10_000;

export interface ProjectRevenueView {
    projectId: string;
    currency: Currency;
    revenueAmount: number;
    refundedAmount: number;
    ordersCount: number;
    paidOrdersCount: number;
}

export type RecentOrderView = Pick<
    OrderRecord,
    | 'id'
    | 'projectId'
    | 'customerName'
    | 'totalAmount'
    | 'currency'
    | 'status'
    | 'createdAt'
>;

export interface TopOrderItemView {
    name: string;
    type: ProductType;
    currency: Currency;
    quantity: number;
    revenueAmount: number;
}

export interface CurrencyTotalsView {
    currency: Currency;
    revenueAmount: number;
    refundedAmount: number;
    ordersCount: number;
    paidOrdersCount: number;
    avgOrderValueAmount: number;
}

export interface DashboardStatsView {
    totals: CurrencyTotalsView[];
    byProject: ProjectRevenueView[];
    topItems: TopOrderItemView[];
    recentOrders: RecentOrderView[];
}

export function rollUpRevenueByCurrency(
    byProject: ProjectRevenueView[],
): CurrencyTotalsView[] {
    const byCurrency = new Map<Currency, CurrencyTotalsView>();

    for (const row of byProject) {
        const sum = byCurrency.get(row.currency) ?? {
            currency: row.currency,
            revenueAmount: 0,
            refundedAmount: 0,
            ordersCount: 0,
            paidOrdersCount: 0,
            avgOrderValueAmount: 0,
        };

        sum.revenueAmount += row.revenueAmount;
        sum.refundedAmount += row.refundedAmount;
        sum.ordersCount += row.ordersCount;
        sum.paidOrdersCount += row.paidOrdersCount;
        byCurrency.set(row.currency, sum);
    }

    return [...byCurrency.values()]
        .map((sum) => ({
            ...sum,
            avgOrderValueAmount:
                sum.paidOrdersCount > 0
                    ? Math.round(sum.revenueAmount / sum.paidOrdersCount)
                    : 0,
        }))
        .sort((a, b) => b.revenueAmount - a.revenueAmount);
}

export interface EmployeeRevenueView {
    employeeId: string | null;
    employeeName: string;
    itemsCount: number;
    revenueAmount: number;
}

export interface DashboardView {
    projects: ProjectRecord[];
    stats: DashboardStatsView;
}

export type MyBookingView = Pick<
    OrderRecord,
    | 'id'
    | 'projectId'
    | 'scheduledAt'
    | 'durationMinutes'
    | 'customerName'
    | 'status'
>;

export interface MyDayView {
    shifts: MyShiftView[];
    bookings: MyBookingView[];
    deliveries: MyDeliveryView[];
    tasks: MyTaskView[];
}

export function orderNumber(order: Pick<OrderRecord, 'id'>): string {
    return order.id.slice(0, 8).toUpperCase();
}
