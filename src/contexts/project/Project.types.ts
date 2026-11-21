import { enumValues } from '@/shared/lib/enum';
import type { OrganizationRole } from '@/contexts/organizationMember/OrganizationMember.types';
import {
    CATALOG_READ_PERMISSIONS,
    DELIVERY_STAFF_PERMISSIONS,
    ORDER_READ_PERMISSIONS,
    Permission,
} from '@/contexts/user/User.types';

export const ProjectType = {
    SHOP: 'shop',
} as const;

export type ProjectType = (typeof ProjectType)[keyof typeof ProjectType];

export const PROJECT_TYPE_VALUES = enumValues(ProjectType);

export const ProjectRole = {
    MANAGER: 'manager',
    EDITOR: 'editor',
    VIEWER: 'viewer',
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
        Permission.MANAGE_INTEGRATIONS,
        Permission.MANAGE_ROLES,
        ...CATALOG_READ_PERMISSIONS,
        ...ORDER_READ_PERMISSIONS,
        ...DELIVERY_STAFF_PERMISSIONS,
    ]),

    [ProjectRole.EDITOR]: new Set<Permission>([
        Permission.VIEW_MEMBERS,
        ...CATALOG_READ_PERMISSIONS,
        ...ORDER_READ_PERMISSIONS,
        ...DELIVERY_STAFF_PERMISSIONS,
    ]),

    [ProjectRole.VIEWER]: new Set<Permission>([
        Permission.VIEW_MEMBERS,
        Permission.VIEW_CATALOG,
        Permission.VIEW_ORDERS,
        Permission.VIEW_DELIVERIES,
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

export const canInProject = (
    role: ProjectRole,
    permission: Permission,
): boolean => {
    return PROJECT_ROLE_PERMISSIONS[role].has(permission);
};

export const projectRolePermissions = (role: ProjectRole): Permission[] => {
    return [...PROJECT_ROLE_PERMISSIONS[role]];
};

export interface ProjectAccess {
    organizationId: string;
    organizationCreatedBy: string;
    organizationRole: OrganizationRole;
    projectRole: ProjectRole | null;
}
