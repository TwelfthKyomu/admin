import 'server-only';

import { cache } from 'react';
import { db } from '@/infrastructure/database/client';
import { ApplicationError } from '@/shared/api/errors';
import { findOrganizationByUserId } from '@/contexts/organization/Organization.lib';
import type { UserOrganizationView } from '@/contexts/organization/Organizations.table';
import { findMemberIdByUserId } from '@/contexts/organizationMember/OrganizationMember.lib';
import {
    canInOrg,
    isOrganizationManager,
    type OrganizationRole,
} from '@/contexts/organizationMember/OrganizationMember.types';
import { findProjectAccess } from '@/contexts/project/Project.lib';
import {
    canInProject,
    type ProjectAccess,
    projectRolePermissions,
} from '@/contexts/project/Project.types';
import { projects } from '@/contexts/project/Projects.table';
import { projectMembers } from '@/contexts/projectMember/ProjectMembers.table';
import {
    ALL_PERMISSIONS,
    Permission,
    type PermissionRequirement,
    toRequiredPermissions,
} from '@/contexts/user/User.types';
import { and, eq, isNull } from 'drizzle-orm';

const getUserOrganization = cache(findOrganizationByUserId);

export const requireUserOrganization = async (
    userId: string,
): Promise<UserOrganizationView> => {
    const org = await getUserOrganization(userId);

    if (!org) {
        throw new ApplicationError('Вы не состоите ни в одной организации');
    }

    return org;
};

const getProjectAccess = cache(findProjectAccess);

const requireProjectAccess = async (
    userId: string,
    projectId: string,
): Promise<ProjectAccess> => {
    const access = await getProjectAccess(userId, projectId);

    if (!access) {
        await requireUserOrganization(userId);
        throw new ApplicationError('Проект не принадлежит вашей организации');
    }

    return access;
};

const hasAnyProjectAccess = (
    access: ProjectAccess,
    userId: string,
): boolean => {
    return (
        access.organizationCreatedBy === userId ||
        isOrganizationManager(access.organizationRole) ||
        access.projectRole !== null
    );
};

export const canSeeProject = async (
    userId: string,
    projectId: string,
): Promise<boolean> => {
    const access = await getProjectAccess(userId, projectId);

    return access !== null && hasAnyProjectAccess(access, userId);
};

const describe = (requirement: PermissionRequirement): string => {
    return toRequiredPermissions(requirement).join('» или «');
};

const grantsInProject = (
    access: ProjectAccess,
    userId: string,
    permission: Permission,
): boolean => {
    if (access.organizationCreatedBy === userId) return true;
    if (isOrganizationManager(access.organizationRole)) return true;
    if (!access.projectRole) return false;

    return canInProject(access.projectRole, permission);
};

export const assertOrganizationRoleCan = (
    role: OrganizationRole,
    permission: PermissionRequirement,
): void => {
    const granted = toRequiredPermissions(permission).some((item) =>
        canInOrg(role, item),
    );

    if (!granted) {
        throw new ApplicationError(
            `Роль «${role}» не позволяет действие «${describe(permission)}»`,
        );
    }
};

export const requireProjectPermission = async (
    userId: string,
    projectId: string,
    permission: PermissionRequirement,
): Promise<{ organizationId: string }> => {
    const access = await requireProjectAccess(userId, projectId);

    const granted = toRequiredPermissions(permission).some((item) =>
        grantsInProject(access, userId, item),
    );

    if (!granted) {
        throw new ApplicationError(
            `Ваша роль не позволяет действие «${describe(permission)}»`,
        );
    }

    return { organizationId: access.organizationId };
};

export const hasProjectPermission = async (
    userId: string,
    projectId: string,
    permission: PermissionRequirement,
): Promise<boolean> => {
    const access = await getProjectAccess(userId, projectId);

    if (!access) return false;

    return toRequiredPermissions(permission).some((item) =>
        grantsInProject(access, userId, item),
    );
};

const ownScope = async (
    userId: string,
    projectId: string,
    fullAccess: Permission[],
    notEmployeeMessage: string,
): Promise<string | null> => {
    const access = await requireProjectAccess(userId, projectId);

    if (fullAccess.some((item) => grantsInProject(access, userId, item))) {
        return null;
    }

    const employeeId = await findMemberIdByUserId(
        access.organizationId,
        userId,
    );

    if (!employeeId) throw new ApplicationError(notEmployeeMessage);

    return employeeId;
};

const OWN_SHIFTS_ONLY =
    'Ваша роль даёт доступ только к своим сменам, но вы не числитесь сотрудником организации';

const OWN_SALES_ONLY =
    'Ваша роль даёт доступ только к своим продажам, но вы не числитесь сотрудником организации';

const OWN_DELIVERIES_ONLY =
    'Ваша роль даёт доступ только к своим доставкам, но вы не числитесь сотрудником организации';

export const ownShiftsEmployeeId = (
    userId: string,
    projectId: string,
): Promise<string | null> => {
    return ownScope(
        userId,
        projectId,
        [Permission.MANAGE_ORDERS],
        OWN_SHIFTS_ONLY,
    );
};

export const visibleShiftsEmployeeId = (
    userId: string,
    projectId: string,
): Promise<string | null> => {
    return ownScope(
        userId,
        projectId,
        [Permission.MANAGE_ORDERS, Permission.VIEW_ORDERS],
        OWN_SHIFTS_ONLY,
    );
};

export const visibleSalesEmployeeId = (
    userId: string,
    projectId: string,
): Promise<string | null> => {
    return ownScope(
        userId,
        projectId,
        [Permission.VIEW_FINANCES],
        OWN_SALES_ONLY,
    );
};

export const ownDeliveriesCourierId = (
    userId: string,
    projectId: string,
): Promise<string | null> => {
    return ownScope(
        userId,
        projectId,
        [Permission.MANAGE_DELIVERIES],
        OWN_DELIVERIES_ONLY,
    );
};

export const visibleDeliveriesCourierId = (
    userId: string,
    projectId: string,
): Promise<string | null> => {
    return ownScope(
        userId,
        projectId,
        [Permission.MANAGE_DELIVERIES, Permission.VIEW_DELIVERIES],
        OWN_DELIVERIES_ONLY,
    );
};

export const assertFullShiftsAccess = async (
    userId: string,
    projectId: string,
): Promise<void> => {
    await requireProjectPermission(userId, projectId, Permission.MANAGE_ORDERS);
};

export const listProjectPermissions = async (
    userId: string,
): Promise<Record<string, Permission[]>> => {
    const organization = await requireUserOrganization(userId);

    const projectRows = await db
        .select({ id: projects.id, role: projectMembers.role })
        .from(projects)
        .leftJoin(
            projectMembers,
            and(
                eq(projectMembers.projectId, projects.id),
                eq(projectMembers.userId, userId),
                isNull(projectMembers.leftAt),
            ),
        )
        .where(
            and(
                eq(projects.organizationId, organization.id),
                isNull(projects.deletedAt),
            ),
        );

    const fullAccess =
        organization.createdBy === userId ||
        isOrganizationManager(organization.role);

    const result: Record<string, Permission[]> = {};

    for (const row of projectRows) {
        if (fullAccess) result[row.id] = [...ALL_PERMISSIONS];
        else if (row.role) result[row.id] = projectRolePermissions(row.role);
    }

    return result;
};
