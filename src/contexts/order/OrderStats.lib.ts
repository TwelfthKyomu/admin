import 'server-only';

import { db } from '@/infrastructure/database/client';
import { PAGE_SIZE_SMALL } from '@/shared/constants/default';
import type { ProjectRecord } from '@/contexts/project/Projects.table';
import { and, count, desc, eq, gt, gte, inArray, lt, sum } from 'drizzle-orm';
import {
    type DashboardStatsView,
    type EmployeeRevenueView,
    OrderStatus,
    type ProjectRevenueView,
    paidShareOf,
    type RecentOrderView,
    rollUpRevenueByCurrency,
    type TopOrderItemView,
} from './Order.types';
import { orderItems, orders } from './Orders.table';

type DashboardProject = Pick<ProjectRecord, 'id' | 'defaultCurrency'>;

const paidOrderColumns = {
    subtotalAmount: orders.subtotalAmount,
    totalAmount: orders.totalAmount,
    paidAmount: orders.paidAmount,
    refundedAmount: orders.refundedAmount,
};

export async function aggregateOrderRevenueByEmployee(
    projectId: string,
    from: Date,
    to: Date,
): Promise<Omit<EmployeeRevenueView, 'employeeName'>[]> {
    const rows = await db
        .select({
            employeeId: orderItems.performerEmployeeId,
            item: { totalAmount: orderItems.totalAmount },
            order: paidOrderColumns,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
            and(
                eq(orders.projectId, projectId),
                eq(orders.status, OrderStatus.COMPLETED),
                gt(orders.paidAmount, 0),
                gte(orders.completedAt, from),
                lt(orders.completedAt, to),
            ),
        );

    const byEmployee = new Map<
        string | null,
        Omit<EmployeeRevenueView, 'employeeName'>
    >();

    for (const row of rows) {
        const current = byEmployee.get(row.employeeId) ?? {
            employeeId: row.employeeId,
            itemsCount: 0,
            revenueAmount: 0,
        };

        current.itemsCount += 1;
        current.revenueAmount += paidShareOf(row.item, row.order);
        byEmployee.set(row.employeeId, current);
    }

    return [...byEmployee.values()]
        .map((row) => ({
            ...row,
            revenueAmount: Math.round(row.revenueAmount),
        }))
        .sort((a, b) => b.revenueAmount - a.revenueAmount);
}

async function aggregateRevenueByProject(
    projects: DashboardProject[],
): Promise<ProjectRevenueView[]> {
    const inProjects = inArray(
        orders.projectId,
        projects.map((project) => project.id),
    );

    const [totals, paidCounts] = await Promise.all([
        db
            .select({
                projectId: orders.projectId,
                currency: orders.currency,
                paidAmount: sum(orders.paidAmount).mapWith(Number),
                refundedAmount: sum(orders.refundedAmount).mapWith(Number),
                ordersCount: count(),
            })
            .from(orders)
            .where(inProjects)
            .groupBy(orders.projectId, orders.currency),
        db
            .select({
                projectId: orders.projectId,
                currency: orders.currency,
                paidOrdersCount: count(),
            })
            .from(orders)
            .where(and(inProjects, gt(orders.paidAmount, 0)))
            .groupBy(orders.projectId, orders.currency),
    ]);

    return projects.flatMap((project) => {
        const own = totals.filter((row) => row.projectId === project.id);

        if (own.length === 0) {
            return [
                {
                    projectId: project.id,
                    currency: project.defaultCurrency,
                    revenueAmount: 0,
                    refundedAmount: 0,
                    ordersCount: 0,
                    paidOrdersCount: 0,
                },
            ];
        }

        return own.map((row) => ({
            projectId: row.projectId,
            currency: row.currency,
            revenueAmount: Math.max(row.paidAmount - row.refundedAmount, 0),
            refundedAmount: row.refundedAmount,
            ordersCount: row.ordersCount,
            paidOrdersCount:
                paidCounts.find(
                    (paid) =>
                        paid.projectId === row.projectId &&
                        paid.currency === row.currency,
                )?.paidOrdersCount ?? 0,
        }));
    });
}

async function aggregateTopOrderItems(
    projectIds: string[],
): Promise<TopOrderItemView[]> {
    const rows = await db
        .select({
            item: {
                name: orderItems.name,
                type: orderItems.type,
                quantity: orderItems.quantity,
                totalAmount: orderItems.totalAmount,
            },
            currency: orders.currency,
            order: paidOrderColumns,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
            and(
                inArray(orders.projectId, projectIds),
                gt(orders.paidAmount, 0),
            ),
        );

    const byItem = new Map<string, TopOrderItemView>();

    for (const { item, currency, order } of rows) {
        const key = `${item.name}\u0000${item.type}\u0000${currency}`;

        const current = byItem.get(key) ?? {
            name: item.name,
            type: item.type,
            currency,
            quantity: 0,
            revenueAmount: 0,
        };

        current.quantity += item.quantity;
        current.revenueAmount += paidShareOf(item, order);
        byItem.set(key, current);
    }

    return [...byItem.values()]
        .map((row) => ({
            ...row,
            revenueAmount: Math.round(row.revenueAmount),
        }))
        .sort((a, b) => b.revenueAmount - a.revenueAmount)
        .slice(0, PAGE_SIZE_SMALL);
}

function listRecentOrders(projectIds: string[]): Promise<RecentOrderView[]> {
    return db
        .select({
            id: orders.id,
            projectId: orders.projectId,
            customerName: orders.customerName,
            totalAmount: orders.totalAmount,
            currency: orders.currency,
            status: orders.status,
            createdAt: orders.createdAt,
        })
        .from(orders)
        .where(inArray(orders.projectId, projectIds))
        .orderBy(desc(orders.createdAt))
        .limit(PAGE_SIZE_SMALL);
}

export async function loadDashboardStats(
    projects: DashboardProject[],
): Promise<DashboardStatsView> {
    const projectIds = projects.map((project) => project.id);

    if (projectIds.length === 0) {
        return { totals: [], byProject: [], topItems: [], recentOrders: [] };
    }

    const [byProject, topItems, recentOrders] = await Promise.all([
        aggregateRevenueByProject(projects),
        aggregateTopOrderItems(projectIds),
        listRecentOrders(projectIds),
    ]);

    return {
        totals: rollUpRevenueByCurrency(byProject),
        byProject,
        topItems,
        recentOrders,
    };
}
