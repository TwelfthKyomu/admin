export const Permission = {
    MANAGE_ORGANIZATION: 'manage_organization',
    MANAGE_BILLING: 'manage_billing',
    VIEW_FINANCES: 'view_finances',
    MANAGE_FINANCES: 'manage_finances',
    MANAGE_MEMBERS: 'manage_members',
    VIEW_MEMBERS: 'view_members',

    MANAGE_CATALOG: 'manage_catalog',
    VIEW_CATALOG: 'view_catalog',

    MANAGE_BOOKINGS: 'manage_bookings',
    MANAGE_OWN_BOOKINGS: 'manage_own_bookings',
    VIEW_BOOKINGS: 'view_bookings',

    MANAGE_DELIVERIES: 'manage_deliveries',
    MANAGE_OWN_DELIVERIES: 'manage_own_deliveries',
    VIEW_DELIVERIES: 'view_deliveries',

    MANAGE_INTEGRATIONS: 'manage_integrations',
    MANAGE_ROLES: 'manage_roles',
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

export const ALL_PERMISSIONS: Permission[] = Object.values(Permission);

export const BOOKING_PERMISSIONS: Permission[] = [
    Permission.MANAGE_BOOKINGS,
    Permission.MANAGE_OWN_BOOKINGS,
];

export const BOOKING_READ_PERMISSIONS: Permission[] = [
    ...BOOKING_PERMISSIONS,
    Permission.VIEW_BOOKINGS,
];

export const DELIVERY_PERMISSIONS: Permission[] = [
    Permission.MANAGE_DELIVERIES,
    Permission.MANAGE_OWN_DELIVERIES,
];

export const DELIVERY_READ_PERMISSIONS: Permission[] = [
    ...DELIVERY_PERMISSIONS,
    Permission.VIEW_DELIVERIES,
];

export const SHIFT_WRITE_PERMISSIONS: Permission[] = [
    ...BOOKING_PERMISSIONS,
    Permission.MANAGE_OWN_DELIVERIES,
];

export const SHIFT_READ_PERMISSIONS: Permission[] = [
    ...BOOKING_READ_PERMISSIONS,
    Permission.MANAGE_OWN_DELIVERIES,
];

export const PROJECT_EMPLOYEES_READ_PERMISSIONS: Permission[] = [
    ...SHIFT_READ_PERMISSIONS,
    ...DELIVERY_READ_PERMISSIONS,
    Permission.MANAGE_MEMBERS,
    Permission.VIEW_FINANCES,
];

export const CATALOG_READ_PERMISSIONS: Permission[] = [
    Permission.MANAGE_CATALOG,
    Permission.VIEW_CATALOG,
];

export const CLIENT_READ_PERMISSIONS: Permission[] = [
    ...BOOKING_READ_PERMISSIONS,
    Permission.VIEW_FINANCES,
];

export const TASK_WRITE_PERMISSIONS: Permission[] = [
    Permission.MANAGE_MEMBERS,
    Permission.MANAGE_BOOKINGS,
];

export const INTEGRATION_READ_PERMISSIONS: Permission[] = [
    Permission.MANAGE_INTEGRATIONS,
    Permission.VIEW_FINANCES,
];

export type PermissionRequirement = Permission | Permission[];

export function toRequiredPermissions(
    requirement: PermissionRequirement,
): Permission[] {
    return typeof requirement === 'string' ? [requirement] : requirement;
}

export function hasPermission(
    granted: Permission[],
    requirement: PermissionRequirement,
): boolean {
    return toRequiredPermissions(requirement).some((permission) =>
        granted.includes(permission),
    );
}
