import 'server-only';

import { db } from '@/infrastructure/database/client';
import { IntegrationType } from '@/contexts/integration/Integration.types';
import { projectIntegrations } from '@/contexts/integration/Integrations.table';
import { orders } from '@/contexts/order/Orders.table';
import { products } from '@/contexts/product/Products.table';
import { projectMembers } from '@/contexts/projectMember/ProjectMembers.table';
import { warehouseStock } from '@/contexts/warehouse/Warehouses.table';
import { and, count, eq, gt, inArray, isNull } from 'drizzle-orm';
import { type ProjectSetupView, SetupStep } from './ProjectSetup.types';

function integrationProjects(projectIds: string[], type: IntegrationType) {
    return db
        .selectDistinct({ projectId: projectIntegrations.projectId })
        .from(projectIntegrations)
        .where(
            and(
                inArray(projectIntegrations.projectId, projectIds),
                eq(projectIntegrations.type, type),
                eq(projectIntegrations.isActive, true),
            ),
        );
}

export async function loadProjectSetup(
    projectIds: string[],
): Promise<ProjectSetupView[]> {
    const [
        withProducts,
        withStock,
        members,
        withPayments,
        withSite,
        withOrders,
    ] = await Promise.all([
        db
            .selectDistinct({ projectId: products.projectId })
            .from(products)
            .where(
                and(
                    inArray(products.projectId, projectIds),
                    isNull(products.deletedAt),
                ),
            ),
        db
            .selectDistinct({ projectId: warehouseStock.projectId })
            .from(warehouseStock)
            .where(
                and(
                    inArray(warehouseStock.projectId, projectIds),
                    gt(warehouseStock.quantity, 0),
                ),
            ),
        db
            .select({ projectId: projectMembers.projectId, total: count() })
            .from(projectMembers)
            .where(inArray(projectMembers.projectId, projectIds))
            .groupBy(projectMembers.projectId),
        integrationProjects(projectIds, IntegrationType.PAYMENT_PROVIDER),
        integrationProjects(projectIds, IntegrationType.STOREFRONT),
        db
            .selectDistinct({ projectId: orders.projectId })
            .from(orders)
            .where(inArray(orders.projectId, projectIds)),
    ]);

    const has = (rows: { projectId: string }[], projectId: string) =>
        rows.some((row) => row.projectId === projectId);

    return projectIds.map((projectId) => ({
        projectId,
        done: [
            has(withProducts, projectId) && SetupStep.PRODUCTS,
            has(withStock, projectId) && SetupStep.STOCK,
            has(
                members.filter((row) => row.total > 1),
                projectId,
            ) && SetupStep.TEAM,
            has(withPayments, projectId) && SetupStep.PAYMENTS,
            has(withSite, projectId) && SetupStep.SITE,
            has(withOrders, projectId) && SetupStep.FIRST_SALE,
        ].filter((step) => step !== false),
    }));
}
