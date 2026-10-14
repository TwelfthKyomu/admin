import { enumValues } from '@/shared/lib/enum';
import type { ProjectRecord } from '@/contexts/project/Projects.table';
import { ALL_PERMISSIONS, Permission } from '@/contexts/user/User.types';
import type { UserRecord } from '@/contexts/user/Users.table';

export const OrganizationRole = {
    OWNER: 'owner',
    ADMIN: 'admin',
    MEMBER: 'member',
} as const;

export type OrganizationRole =
    (typeof OrganizationRole)[keyof typeof OrganizationRole];

export const ORGANIZATION_ROLE_VALUES = enumValues(OrganizationRole);

const ORG_ROLE_PERMISSIONS: Record<
    OrganizationRole,
    ReadonlySet<Permission>
> = {
    [OrganizationRole.OWNER]: new Set<Permission>(ALL_PERMISSIONS),

    [OrganizationRole.ADMIN]: new Set<Permission>([
        Permission.MANAGE_ORGANIZATION,
        Permission.MANAGE_BILLING,
        Permission.VIEW_FINANCES,
        Permission.MANAGE_FINANCES,
        Permission.MANAGE_MEMBERS,
        Permission.VIEW_MEMBERS,
        Permission.MANAGE_CATALOG,
        Permission.VIEW_CATALOG,
        Permission.MANAGE_BOOKINGS,
        Permission.MANAGE_OWN_BOOKINGS,
        Permission.VIEW_BOOKINGS,
        Permission.MANAGE_DELIVERIES,
        Permission.VIEW_DELIVERIES,
        Permission.MANAGE_INTEGRATIONS,
        Permission.MANAGE_ROLES,
    ]),

    [OrganizationRole.MEMBER]: new Set<Permission>([
        Permission.VIEW_MEMBERS,
        Permission.VIEW_CATALOG,
        Permission.MANAGE_OWN_BOOKINGS,
    ]),
};

export function isOrganizationManager(role: OrganizationRole): boolean {
    return canInOrg(role, Permission.MANAGE_ORGANIZATION);
}

export function canInOrg(
    role: OrganizationRole,
    permission: Permission,
): boolean {
    return ORG_ROLE_PERMISSIONS[role].has(permission);
}

export interface OrganizationMemberView {
    id: string;
    role: OrganizationRole;
    joinedAt: Date;
    user: Pick<UserRecord, 'id' | 'name' | 'email' | 'image'>;
    projects: Pick<ProjectRecord, 'id' | 'name' | 'color'>[];
}
