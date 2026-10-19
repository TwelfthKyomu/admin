'use client';

import { makeScopedMutation } from '@/shared/lib/mutations';
import { itemQuery, listQuery } from '@/shared/lib/queries';
import { useQuery } from '@tanstack/react-query';
import {
    createOrderAction,
    employeeRevenueAction,
    orderDetailAction,
    ordersAction,
} from './Order.actions';
import type { OrderStatus } from './Order.types';
import {
    recordOrderPaymentAction,
    recordOrderRefundAction,
} from './OrderPayment.actions';
import { changeOrderSellerAction } from './OrderSeller.actions';
import {
    dashboardAction,
    myDayAction,
    mySalesAction,
} from './OrderStats.actions';
import { changeOrderStatusAction } from './OrderStatus.actions';

interface ListOptions {
    projectId: string;
    statuses?: OrderStatus[];
    from?: Date;
    to?: Date;
    clientId?: string;
    sellerId?: string;
    search?: string;
    enabled?: boolean;
}

interface DetailOptions {
    id: string;
    projectId: string;
}

const orderQueries = {
    all: ['orders'] as const,
    list: ({
        projectId,
        statuses,
        from,
        to,
        clientId,
        sellerId,
        search,
        enabled = true,
    }: ListOptions) =>
        listQuery(
            [
                ...orderQueries.all,
                'list',
                projectId,
                statuses?.join(',') ?? '',
                from?.toISOString() ?? '',
                to?.toISOString() ?? '',
                clientId ?? '',
                sellerId ?? '',
                search ?? '',
            ],
            () =>
                ordersAction({
                    projectId,
                    statuses,
                    from,
                    to,
                    clientId,
                    sellerId,
                    search,
                }),
            { enabled: enabled && projectId.length > 0, staleTime: 15_000 },
        ),
    detail: ({ id, projectId }: DetailOptions) =>
        itemQuery(
            [...orderQueries.all, 'detail', projectId, id],
            () => orderDetailAction({ id, projectId }),
            { staleTime: 5_000 },
        ),
};

export function useOrdersList(opts: ListOptions) {
    return useQuery(orderQueries.list(opts));
}

export function useOrderDetail(opts: DetailOptions) {
    return useQuery(orderQueries.detail(opts));
}

export const useCreateOrder = makeScopedMutation(createOrderAction);
export const useChangeOrderStatus = makeScopedMutation(changeOrderStatusAction);
export const useChangeOrderSeller = makeScopedMutation(changeOrderSellerAction);
export const useRecordOrderPayment = makeScopedMutation(
    recordOrderPaymentAction,
);
export const useRecordOrderRefund = makeScopedMutation(recordOrderRefundAction);

interface RevenueOptions {
    projectId: string;
    from: Date;
    to: Date;
}

const employeeRevenueQueries = {
    all: ['employee-revenue'] as const,
    range: ({ projectId, from, to }: RevenueOptions) =>
        listQuery(
            [
                ...employeeRevenueQueries.all,
                'range',
                projectId,
                from.toISOString(),
                to.toISOString(),
            ],
            () => employeeRevenueAction({ projectId, from, to }),
            { enabled: projectId.length > 0 },
        ),
};

export function useEmployeeRevenue(opts: RevenueOptions) {
    return useQuery(employeeRevenueQueries.range(opts));
}

const dashboardQueries = {
    all: ['dashboard'] as const,
    summary: () =>
        itemQuery([...dashboardQueries.all, 'summary'], dashboardAction),
};

export function useDashboard() {
    return useQuery(dashboardQueries.summary());
}

interface MyDayOptions {
    from: Date;
    to: Date;
}

const myDayQueries = {
    all: [...dashboardQueries.all, 'my-day'] as const,
    range: ({ from, to }: MyDayOptions) =>
        itemQuery([...myDayQueries.all, from.toISOString()], () =>
            myDayAction({ from, to }),
        ),
};

export function useMyDay(opts: MyDayOptions) {
    return useQuery(myDayQueries.range(opts));
}

interface MySalesOptions {
    dayFrom: Date;
    monthFrom: Date;
    to: Date;
}

const mySalesQueries = {
    all: [...dashboardQueries.all, 'my-sales'] as const,
    range: ({ dayFrom, monthFrom, to }: MySalesOptions) =>
        itemQuery([...mySalesQueries.all, dayFrom.toISOString()], () =>
            mySalesAction({ dayFrom, monthFrom, to }),
        ),
};

export function useMySales(opts: MySalesOptions) {
    return useQuery(mySalesQueries.range(opts));
}
