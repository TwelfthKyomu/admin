import { DEFAULT_CURRENCY } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import { ProductType } from '@/contexts/product/Product.types';
import { describe, expect, it } from 'vitest';
import type { OrderItemInput } from './Order.schema';
import {
    confirmationSeller,
    getNextOrderStatuses,
    isOrderCancelled,
    isReadyOverdue,
    isScheduledSale,
    maskSeller,
    ORDER_STATUS_VALUES,
    ORDER_TERMINAL_STATUSES,
    OrderSource,
    OrderStatus,
    orderAmountDue,
    orderRevenueShare,
    PaymentStatus,
    type ProjectRevenueView,
    readyPaymentDetails,
    recomputePaymentStatus,
    rollUpRevenueByCurrency,
    salesTotal,
    stockLinesFromOrderItems,
    summarizeSales,
    sumOrderItems,
} from './Order.types';

describe('recomputePaymentStatus', () => {
    it('бесплатный заказ без движений — не оплачен', () => {
        expect(
            recomputePaymentStatus({
                totalAmount: 0,
                paidAmount: 0,
                refundedAmount: 0,
            }),
        ).toBe(PaymentStatus.UNPAID);
    });

    it('часть суммы — частично', () => {
        expect(
            recomputePaymentStatus({
                totalAmount: 1000,
                paidAmount: 400,
                refundedAmount: 0,
            }),
        ).toBe(PaymentStatus.PARTIAL);
    });

    it('вся сумма или переплата — оплачен', () => {
        expect(
            recomputePaymentStatus({
                totalAmount: 1000,
                paidAmount: 1000,
                refundedAmount: 0,
            }),
        ).toBe(PaymentStatus.PAID);

        expect(
            recomputePaymentStatus({
                totalAmount: 1000,
                paidAmount: 1200,
                refundedAmount: 0,
            }),
        ).toBe(PaymentStatus.PAID);
    });

    it('возврат всего оплаченного — возвращён', () => {
        expect(
            recomputePaymentStatus({
                totalAmount: 1000,
                paidAmount: 1000,
                refundedAmount: 1000,
            }),
        ).toBe(PaymentStatus.REFUNDED);
    });

    it('частичный возврат считается от остатка', () => {
        expect(
            recomputePaymentStatus({
                totalAmount: 1000,
                paidAmount: 1000,
                refundedAmount: 300,
            }),
        ).toBe(PaymentStatus.PARTIAL);
    });
});

describe('orderAmountDue', () => {
    it('остаток к оплате учитывает возвраты', () => {
        expect(
            orderAmountDue({
                totalAmount: 1000,
                paidAmount: 1000,
                refundedAmount: 300,
            }),
        ).toBe(300);
    });

    it('переплата не даёт отрицательный долг', () => {
        expect(
            orderAmountDue({
                totalAmount: 1000,
                paidAmount: 1500,
                refundedAmount: 0,
            }),
        ).toBe(0);
    });
});

const NO_DELIVERY = { hasDelivery: false };

describe('переходы статусов заказа', () => {
    it('из конечных статусов перейти никуда нельзя', () => {
        for (const status of ORDER_TERMINAL_STATUSES) {
            expect(getNextOrderStatuses(status, NO_DELIVERY)).toEqual([]);
        }
    });

    it('незавершённый заказ всегда можно отменить', () => {
        for (const status of ORDER_STATUS_VALUES) {
            if (ORDER_TERMINAL_STATUSES.includes(status)) continue;

            expect(getNextOrderStatuses(status, NO_DELIVERY)).toContain(
                OrderStatus.CANCELLED,
            );
        }
    });

    it('статус не переходит сам в себя', () => {
        for (const status of ORDER_STATUS_VALUES) {
            expect(getNextOrderStatuses(status, NO_DELIVERY)).not.toContain(
                status,
            );
        }
    });

    it('из «Новый» можно подтвердить или отменить', () => {
        expect(getNextOrderStatuses(OrderStatus.PENDING, NO_DELIVERY)).toEqual([
            OrderStatus.CONFIRMED,
            OrderStatus.CANCELLED,
        ]);
    });

    it('подтверждённый можно взять в работу, выполнить или отменить', () => {
        expect(
            getNextOrderStatuses(OrderStatus.CONFIRMED, NO_DELIVERY),
        ).toEqual([
            OrderStatus.IN_PROGRESS,
            OrderStatus.READY,
            OrderStatus.COMPLETED,
            OrderStatus.CANCELLED,
        ]);
    });

    it('принимать оплату нельзя только в отменённый', () => {
        expect(isOrderCancelled(OrderStatus.CANCELLED)).toBe(true);
        expect(isOrderCancelled(OrderStatus.COMPLETED)).toBe(false);
        expect(isOrderCancelled(OrderStatus.PENDING)).toBe(false);
    });
});

describe('rollUpRevenueByCurrency', () => {
    function row(overrides: Partial<ProjectRevenueView>): ProjectRevenueView {
        return {
            projectId: 'p',
            currency: 'RUB',
            revenueAmount: 0,
            refundedAmount: 0,
            ordersCount: 0,
            paidOrdersCount: 0,
            ...overrides,
        };
    }

    it('суммирует проекты по валютам и не смешивает валюты', () => {
        const totals = rollUpRevenueByCurrency([
            row({
                projectId: 'a',
                revenueAmount: 1000,
                ordersCount: 3,
                paidOrdersCount: 2,
            }),
            row({
                projectId: 'b',
                revenueAmount: 500,
                ordersCount: 1,
                paidOrdersCount: 1,
            }),
            row({
                projectId: 'c',
                currency: 'USD',
                revenueAmount: 200,
                paidOrdersCount: 1,
            }),
        ]);

        expect(totals).toHaveLength(2);

        expect(totals[0]).toMatchObject({
            currency: 'RUB',
            revenueAmount: 1500,
            ordersCount: 4,
            paidOrdersCount: 3,
            avgOrderValueAmount: 500,
        });

        expect(totals[1]).toMatchObject({
            currency: 'USD',
            revenueAmount: 200,
        });
    });

    it('без оплаченных заказов средний чек равен нулю', () => {
        const [total] = rollUpRevenueByCurrency([row({ ordersCount: 2 })]);

        expect(total?.avgOrderValueAmount).toBe(0);
    });
});

function item(overrides: Partial<OrderItemInput>): OrderItemInput {
    return {
        name: 'Позиция',
        type: ProductType.PHYSICAL,
        unitPriceAmount: 0,
        quantity: 1,
        ...overrides,
    };
}

describe('sumOrderItems', () => {
    it('цена × количество по всем позициям', () => {
        expect(
            sumOrderItems([
                item({ unitPriceAmount: 15_000, quantity: 2 }),
                item({ unitPriceAmount: 990, quantity: 3 }),
            ]),
        ).toBe(32_970);
    });

    it('пустой заказ стоит ноль', () => {
        expect(sumOrderItems([])).toBe(0);
    });
});

describe('stockLinesFromOrderItems', () => {
    it('списывает со склада только товары из каталога, не услуги', () => {
        expect(
            stockLinesFromOrderItems([
                {
                    productId: 'mug',
                    variantId: null,
                    type: ProductType.PHYSICAL,
                    quantity: 2,
                },
                {
                    productId: 'cut',
                    variantId: null,
                    type: ProductType.SERVICE,
                    quantity: 1,
                },
                {
                    productId: null,
                    variantId: null,
                    type: ProductType.PHYSICAL,
                    quantity: 5,
                },
                {
                    productId: 'tee',
                    variantId: 'tee-red-m',
                    type: ProductType.PHYSICAL,
                    quantity: 1,
                },
            ]),
        ).toEqual([
            { productId: 'mug', variantId: null, quantity: 2 },
            { productId: 'tee', variantId: 'tee-red-m', quantity: 1 },
        ]);
    });
});

describe('продавец заказа', () => {
    it('заказ с сайта получает продавцом того, кто его подтвердил', () => {
        expect(
            confirmationSeller(
                { source: OrderSource.STOREFRONT, sellerId: null },
                'm1',
            ),
        ).toBe('m1');
    });

    it('продавца, который уже есть, подтверждение не меняет', () => {
        expect(
            confirmationSeller(
                { source: OrderSource.STOREFRONT, sellerId: 'm2' },
                'm1',
            ),
        ).toBe('m2');

        expect(
            confirmationSeller(
                { source: OrderSource.STORE, sellerId: null },
                'm1',
            ),
        ).toBeNull();
    });

    it('продавец без доступа к финансам видит только своего продавца', () => {
        expect(maskSeller({ sellerId: 'm2' }, 'm1').sellerId).toBeNull();
        expect(maskSeller({ sellerId: 'm1' }, 'm1').sellerId).toBe('m1');
        expect(maskSeller({ sellerId: 'm2' }, null).sellerId).toBe('m2');
    });

    it('выручка продавца — оплаченное за вычетом возвратов, не больше суммы заказа', () => {
        expect(
            orderRevenueShare({
                totalAmount: 10_000,
                paidAmount: 10_000,
                refundedAmount: 3_000,
            }),
        ).toBe(7_000);

        expect(
            orderRevenueShare({
                totalAmount: 10_000,
                paidAmount: 12_000,
                refundedAmount: 0,
            }),
        ).toBe(10_000);

        expect(
            orderRevenueShare({
                totalAmount: 10_000,
                paidAmount: 2_000,
                refundedAmount: 5_000,
            }),
        ).toBe(0);
    });
});

describe('продажи в расписании', () => {
    it('продажа видна, если есть продавец и время продажи и она не отменена', () => {
        const soldAt = new Date('2026-10-20T10:00');

        expect(
            isScheduledSale({
                sellerId: 'm1',
                soldAt,
                status: OrderStatus.COMPLETED,
            }),
        ).toBe(true);

        expect(
            isScheduledSale({
                sellerId: null,
                soldAt,
                status: OrderStatus.COMPLETED,
            }),
        ).toBe(false);

        expect(
            isScheduledSale({
                sellerId: 'm1',
                soldAt: null,
                status: OrderStatus.COMPLETED,
            }),
        ).toBe(false);

        expect(
            isScheduledSale({
                sellerId: 'm1',
                soldAt,
                status: OrderStatus.CANCELLED,
            }),
        ).toBe(false);
    });

    it('итог — сумма заказов', () => {
        expect(
            salesTotal([{ totalAmount: 1_500 }, { totalAmount: 2_500 }]),
        ).toBe(4_000);
    });
});

describe('статус «Готово»', () => {
    it('доступен из «Подтверждён» и «В работе», если нет доставки', () => {
        expect(
            getNextOrderStatuses(OrderStatus.CONFIRMED, NO_DELIVERY),
        ).toContain(OrderStatus.READY);

        expect(
            getNextOrderStatuses(OrderStatus.IN_PROGRESS, NO_DELIVERY),
        ).toContain(OrderStatus.READY);

        expect(getNextOrderStatuses(OrderStatus.READY, NO_DELIVERY)).toEqual([
            OrderStatus.COMPLETED,
            OrderStatus.CANCELLED,
        ]);
    });

    it('заказу с доставкой не предлагается', () => {
        expect(
            getNextOrderStatuses(OrderStatus.CONFIRMED, { hasDelivery: true }),
        ).not.toContain(OrderStatus.READY);
    });

    it('просрочка — срок прошёл, а заказ ещё не готов', () => {
        const now = new Date('2026-10-20T12:00');
        const readyBy = new Date('2026-10-20T10:00');

        expect(
            isReadyOverdue({ readyBy, status: OrderStatus.IN_PROGRESS }, now),
        ).toBe(true);

        expect(
            isReadyOverdue({ readyBy, status: OrderStatus.READY }, now),
        ).toBe(false);

        expect(
            isReadyOverdue(
                { readyBy: null, status: OrderStatus.IN_PROGRESS },
                now,
            ),
        ).toBe(false);
    });
});

describe('письмо «Готово»', () => {
    it('оплаченный заказ — без строки о доплате', () => {
        expect(
            readyPaymentDetails({
                totalAmount: 1_500,
                paidAmount: 1_500,
                refundedAmount: 0,
                currency: DEFAULT_CURRENCY,
            }),
        ).toEqual([]);
    });

    it('неоплаченный остаток — к оплате при получении', () => {
        expect(
            readyPaymentDetails({
                totalAmount: 1_500,
                paidAmount: 500,
                refundedAmount: 0,
                currency: DEFAULT_CURRENCY,
            }),
        ).toEqual([
            `К оплате при получении: ${fmtMoney(1_000, DEFAULT_CURRENCY)}`,
        ]);
    });
});

describe('summarizeSales', () => {
    it('складывает продажи и считает заработок по ставкам, как зарплата', () => {
        expect(
            summarizeSales(
                [
                    {
                        sellerId: 'm1',
                        source: OrderSource.STORE,
                        ordersCount: 3,
                        revenueAmount: 10_000,
                    },
                    {
                        sellerId: 'm1',
                        source: OrderSource.STOREFRONT,
                        ordersCount: 1,
                        revenueAmount: 1_001,
                    },
                ],
                { commissionRate: 10, siteCommissionRate: 50 },
            ),
        ).toEqual({
            ordersCount: 4,
            storeRevenue: 10_000,
            siteRevenue: 1_001,
            storeEarned: 1_000,
            siteEarned: 500,
        });
    });
});
