import 'server-only';

import { db } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { fmtBytes } from '@/shared/format/bytes';
import { IntegrationType } from '@/contexts/integration/Integration.types';
import { projectIntegrations } from '@/contexts/integration/Integrations.table';
import { organizations } from '@/contexts/organization/Organizations.table';
import { countOrganizationProjects } from '@/contexts/project/Project.lib';
import { projects } from '@/contexts/project/Projects.table';
import { projectFiles } from '@/contexts/projectFile/ProjectFiles.table';
import { env } from '@/env';
import { and, eq, notExists, sum } from 'drizzle-orm';
import {
    LIMITS_BY_PLAN,
    type OrganizationSubscriptionStatus,
    PLAN_CATALOG,
    type PlanLimits,
    SubscriptionPlan,
} from './Subscription.types';

export function billingKeys(): {
    secretKey: string;
    webhookSecret: string;
} | null {
    const secretKey = env.BILLING_STRIPE_SECRET_KEY;
    const webhookSecret = env.BILLING_STRIPE_WEBHOOK_SECRET;

    return secretKey && webhookSecret ? { secretKey, webhookSecret } : null;
}

function effectivePlan(row: {
    plan: SubscriptionPlan;
    planExpiresAt: Date | null;
}): SubscriptionPlan {
    return row.planExpiresAt && row.planExpiresAt <= new Date()
        ? SubscriptionPlan.FREE
        : row.plan;
}

async function loadOrganizationPlan(organizationId: string) {
    const [row] = await db
        .select({
            plan: organizations.plan,
            planExpiresAt: organizations.planExpiresAt,
        })
        .from(organizations)
        .where(eq(organizations.id, organizationId))
        .limit(1);

    return row ?? { plan: SubscriptionPlan.FREE, planExpiresAt: null };
}

async function getOrganizationPlan(
    organizationId: string,
): Promise<SubscriptionPlan> {
    return effectivePlan(await loadOrganizationPlan(organizationId));
}

export async function getOrganizationSubscriptionStatus(
    organizationId: string,
): Promise<OrganizationSubscriptionStatus> {
    const [row, projectsUsed, storageUsedBytes] = await Promise.all([
        loadOrganizationPlan(organizationId),
        countOrganizationProjects(organizationId),
        sumOrganizationStorageBytes(organizationId),
    ]);

    const plan = effectivePlan(row);
    const limits = LIMITS_BY_PLAN[plan];

    return {
        plan,
        planExpiresAt: plan === row.plan ? row.planExpiresAt : null,
        billingEnabled: billingKeys() !== null,
        projectsUsed,
        projectLimit: limits.projects,
        canCreateProject: projectsUsed < limits.projects,
        storageUsedBytes,
        storageLimitBytes: limits.storageBytes,
    };
}

async function sumOrganizationStorageBytes(
    organizationId: string,
): Promise<number> {
    const ownStorage = db
        .select({ id: projectIntegrations.id })
        .from(projectIntegrations)
        .where(
            and(
                eq(projectIntegrations.projectId, projects.id),
                eq(projectIntegrations.type, IntegrationType.STORAGE),
                eq(projectIntegrations.isActive, true),
            ),
        );

    const [row] = await db
        .select({ total: sum(projectFiles.sizeBytes) })
        .from(projectFiles)
        .innerJoin(projects, eq(projects.id, projectFiles.projectId))
        .where(
            and(
                eq(projects.organizationId, organizationId),
                notExists(ownStorage),
            ),
        );

    return Number(row?.total ?? 0);
}

export async function storageQuotaError(
    organizationId: string,
    addedBytes: number,
): Promise<string | undefined> {
    const [plan, usedBytes] = await Promise.all([
        getOrganizationPlan(organizationId),
        sumOrganizationStorageBytes(organizationId),
    ]);

    const limitBytes = LIMITS_BY_PLAN[plan].storageBytes;

    if (usedBytes + addedBytes <= limitBytes) return undefined;

    return `Хранилище организации на тарифе «${PLAN_CATALOG[plan].label}» — ${fmtBytes(limitBytes)}, уже занято ${fmtBytes(usedBytes)}.`;
}

export async function assertPlanLimit(
    organizationId: string,
    limitKey: keyof PlanLimits,
    used: number,
    subject: string,
): Promise<void> {
    const plan = await getOrganizationPlan(organizationId);
    const limit = LIMITS_BY_PLAN[plan][limitKey];

    if (used < limit) return;

    throw new ApplicationError(
        `Лимит ${subject} на тарифе «${plan}» — ${limit}. Обновите тариф, чтобы добавлять больше ${subject}.`,
    );
}
