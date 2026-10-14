import 'server-only';

import { cache } from 'react';
import { db, type Tx } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import type { Currency } from '@/shared/constants/currency';
import { orders } from '@/contexts/order/Orders.table';
import { organizations } from '@/contexts/organization/Organizations.table';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { products } from '@/contexts/product/Products.table';
import { projectMembers } from '@/contexts/projectMember/ProjectMembers.table';
import { and, asc, count, eq, isNull } from 'drizzle-orm';
import type { ProjectAccess } from './Project.types';
import { type ProjectRecord, projects } from './Projects.table';

export async function projectDefaultCurrency(
    projectId: string,
): Promise<Currency> {
    const [project] = await db
        .select({ defaultCurrency: projects.defaultCurrency })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);

    if (!project) throw new ApplicationError('Проект не найден');

    return project.defaultCurrency;
}

export async function getProject(
    projectId: string,
): Promise<ProjectRecord | null> {
    const [project] = await db
        .select()
        .from(projects)
        .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
        .limit(1);

    return project ?? null;
}

export async function countOrganizationProjects(
    organizationId: string,
): Promise<number> {
    const [row] = await db
        .select({ value: count() })
        .from(projects)
        .where(
            and(
                eq(projects.organizationId, organizationId),
                isNull(projects.deletedAt),
            ),
        );

    return row?.value ?? 0;
}

export async function switchProjectCurrency(
    tx: Tx,
    projectId: string,
    currency: Currency,
): Promise<void> {
    const [row] = await tx
        .select({ value: count() })
        .from(orders)
        .where(eq(orders.projectId, projectId));

    if ((row?.value ?? 0) > 0) {
        throw new ApplicationError(
            'Валюту нельзя сменить: в проекте уже есть заказы, и суммы в отчётах, кассе и расчётах смешались бы. Для другой валюты создайте отдельный проект.',
        );
    }

    await tx
        .update(products)
        .set({ currency })
        .where(eq(products.projectId, projectId));
}

export async function findProjectAccess(
    userId: string,
    projectId: string,
): Promise<ProjectAccess | null> {
    const [access] = await db
        .select({
            organizationId: organizations.id,
            organizationCreatedBy: organizations.createdBy,
            organizationRole: organizationMembers.role,
            projectRole: projectMembers.role,
        })
        .from(projects)
        .innerJoin(organizations, eq(organizations.id, projects.organizationId))
        .innerJoin(
            organizationMembers,
            and(
                eq(organizationMembers.organizationId, organizations.id),
                eq(organizationMembers.userId, userId),
                isNull(organizationMembers.leftAt),
            ),
        )
        .leftJoin(
            projectMembers,
            and(
                eq(projectMembers.projectId, projects.id),
                eq(projectMembers.userId, userId),
                isNull(projectMembers.leftAt),
            ),
        )
        .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
        .limit(1);

    return access ?? null;
}

export async function nextTaskNumber(
    tx: Tx,
    projectId: string,
): Promise<number> {
    const [project] = await tx
        .select({ taskCounter: projects.taskCounter })
        .from(projects)
        .where(and(eq(projects.id, projectId), isNull(projects.deletedAt)))
        .limit(1)
        .for('update');

    if (!project) throw new ApplicationError('Не удалось выдать номер задачи');

    const number = project.taskCounter + 1;

    await tx
        .update(projects)
        .set({ taskCounter: number })
        .where(eq(projects.id, projectId));

    return number;
}

export const listOrganizationProjects = cache(async (organizationId: string) =>
    db
        .select()
        .from(projects)
        .where(
            and(
                eq(projects.organizationId, organizationId),
                isNull(projects.deletedAt),
            ),
        )
        .orderBy(asc(projects.createdAt)),
);
