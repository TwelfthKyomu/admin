import { enumValues } from '@/shared/lib/enum';
import type { OrganizationRole } from '@/contexts/organizationMember/OrganizationMember.types';
import { Permission } from '@/contexts/user/User.types';

export const ProjectType = {
    SHOP: 'shop',
} as const;

export type ProjectType = (typeof ProjectType)[keyof typeof ProjectType];

export const PROJECT_TYPE_VALUES = enumValues(ProjectType);

export const ProjectRole = {
    MANAGER: 'manager',
    EDITOR: 'editor',
    VIEWER: 'viewer',
    MASTER: 'master',
    COURIER: 'courier',
    ACCOUNTANT: 'accountant',
} as const;

export type ProjectRole = (typeof ProjectRole)[keyof typeof ProjectRole];

export const PROJECT_ROLE_VALUES = enumValues(ProjectRole);

const PROJECT_ROLE_PERMISSIONS: Record<ProjectRole, ReadonlySet<Permission>> = {
    [ProjectRole.MANAGER]: new Set<Permission>([
        Permission.VIEW_FINANCES,
        Permission.MANAGE_FINANCES,
        Permission.MANAGE_MEMBERS,
        Permission.VIEW_MEMBERS,
        Permission.MANAGE_CATALOG,
        Permission.VIEW_CATALOG,
        Permission.MANAGE_ORDERS,
        Permission.MANAGE_OWN_BOOKINGS,
        Permission.VIEW_ORDERS,
        Permission.MANAGE_DELIVERIES,
        Permission.VIEW_DELIVERIES,
        Permission.MANAGE_INTEGRATIONS,
        Permission.MANAGE_ROLES,
    ]),

    [ProjectRole.EDITOR]: new Set<Permission>([
        Permission.VIEW_MEMBERS,
        Permission.MANAGE_CATALOG,
        Permission.VIEW_CATALOG,
        Permission.MANAGE_ORDERS,
        Permission.MANAGE_OWN_BOOKINGS,
        Permission.VIEW_ORDERS,
        Permission.MANAGE_DELIVERIES,
        Permission.VIEW_DELIVERIES,
    ]),

    [ProjectRole.VIEWER]: new Set<Permission>([
        Permission.VIEW_MEMBERS,
        Permission.VIEW_CATALOG,
        Permission.VIEW_ORDERS,
        Permission.VIEW_DELIVERIES,
    ]),

    [ProjectRole.MASTER]: new Set<Permission>([
        Permission.VIEW_CATALOG,
        Permission.MANAGE_OWN_BOOKINGS,
    ]),

    [ProjectRole.COURIER]: new Set<Permission>([
        Permission.VIEW_CATALOG,
        Permission.MANAGE_OWN_DELIVERIES,
    ]),

    [ProjectRole.ACCOUNTANT]: new Set<Permission>([
        Permission.VIEW_FINANCES,
        Permission.MANAGE_FINANCES,
        Permission.VIEW_MEMBERS,
        Permission.VIEW_CATALOG,
        Permission.VIEW_ORDERS,
        Permission.VIEW_DELIVERIES,
    ]),
};

export function canInProject(
    role: ProjectRole,
    permission: Permission,
): boolean {
    return PROJECT_ROLE_PERMISSIONS[role].has(permission);
}

export function projectRolePermissions(role: ProjectRole): Permission[] {
    return [...PROJECT_ROLE_PERMISSIONS[role]];
}

export interface ProjectAccess {
    organizationId: string;
    organizationCreatedBy: string;
    organizationRole: OrganizationRole;
    projectRole: ProjectRole | null;
}
