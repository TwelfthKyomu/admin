import { ProductType } from '@/contexts/product/Product.types';
import { describe, expect, it } from 'vitest';
import type { OrderItemInput } from './Order.schema';
import {
    confirmationSeller,
    getNextOrderStatuses,
    inferDurationMinutes,
    isOrderCancelled,
    maskSeller,
    ORDER_STATUS_VALUES,
    ORDER_TERMINAL_STATUSES,
    OrderSource,
    OrderStatus,
    orderAmountDue,
    orderRevenueShare,
    PaymentStatus,
    type ProjectRevenueView,
    recomputePaymentStatus,
    rollUpRevenueByCurrency,
    stockLinesFromOrderItems,
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

describe('переходы статусов заказа', () => {
    it('из конечных статусов перейти никуда нельзя', () => {
        for (const status of ORDER_TERMINAL_STATUSES) {
            expect(getNextOrderStatuses(status)).toEqual([]);
        }
    });

    it('незавершённый заказ всегда можно отменить', () => {
        for (const status of ORDER_STATUS_VALUES) {
            if (ORDER_TERMINAL_STATUSES.includes(status)) continue;

            expect(getNextOrderStatuses(status)).toContain(
                OrderStatus.CANCELLED,
            );
        }
    });

    it('статус не переходит сам в себя', () => {
        for (const status of ORDER_STATUS_VALUES) {
            expect(getNextOrderStatuses(status)).not.toContain(status);
        }
    });

    it('после начала работы «не пришёл» уже не ставится', () => {
        expect(getNextOrderStatuses(OrderStatus.IN_PROGRESS)).not.toContain(
            OrderStatus.NO_SHOW,
        );
    });

    it('принимать оплату нельзя только в отменённый и «не пришёл»', () => {
        expect(isOrderCancelled(OrderStatus.CANCELLED)).toBe(true);
        expect(isOrderCancelled(OrderStatus.NO_SHOW)).toBe(true);
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

describe('inferDurationMinutes', () => {
    it('складывает длительность только услуг', () => {
        expect(
            inferDurationMinutes([
                item({
                    type: ProductType.SERVICE,
                    durationMinutes: 30,
                    quantity: 2,
                }),
                item({ type: ProductType.SERVICE, durationMinutes: 15 }),
                item({ type: ProductType.PHYSICAL, durationMinutes: 999 }),
            ]),
        ).toBe(75);
    });

    it('без услуг с длительностью — null', () => {
        expect(
            inferDurationMinutes([item({ type: ProductType.PHYSICAL })]),
        ).toBeNull();

        expect(
            inferDurationMinutes([item({ type: ProductType.SERVICE })]),
        ).toBeNull();
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
