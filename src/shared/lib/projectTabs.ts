import {
    CATALOG_READ_PERMISSIONS,
    CLIENT_READ_PERMISSIONS,
    DELIVERY_READ_PERMISSIONS,
    hasPermission,
    ORDER_READ_PERMISSIONS,
    Permission,
    SHIFT_READ_PERMISSIONS,
} from '@/contexts/user/User.types';

export type TabGroup = 'catalog' | 'selling' | 'schedule' | 'team' | 'other';

export interface ProjectTabMeta {
    value: string;
    group: TabGroup;
    permissions: Permission[];
}

const TAB_GROUP_ORDER: TabGroup[] = [
    'catalog',
    'selling',
    'schedule',
    'team',
    'other',
];

export const PROJECT_TAB_META: ProjectTabMeta[] = [
    {
        value: 'products',
        group: 'catalog',
        permissions: CATALOG_READ_PERMISSIONS,
    },
    {
        value: 'categories',
        group: 'catalog',
        permissions: CATALOG_READ_PERMISSIONS,
    },
    {
        value: 'badges',
        group: 'catalog',
        permissions: CATALOG_READ_PERMISSIONS,
    },
    {
        value: 'looks',
        group: 'catalog',
        permissions: CATALOG_READ_PERMISSIONS,
    },
    {
        value: 'warehouse',
        group: 'catalog',
        permissions: CATALOG_READ_PERMISSIONS,
    },
    {
        value: 'coupons',
        group: 'catalog',
        permissions: [Permission.MANAGE_CATALOG],
    },
    {
        value: 'orders',
        group: 'selling',
        permissions: ORDER_READ_PERMISSIONS,
    },
    {
        value: 'deliveries',
        group: 'selling',
        permissions: DELIVERY_READ_PERMISSIONS,
    },
    {
        value: 'clients',
        group: 'selling',
        permissions: CLIENT_READ_PERMISSIONS,
    },
    {
        value: 'cash',
        group: 'selling',
        permissions: [Permission.VIEW_FINANCES],
    },
    {
        value: 'payroll',
        group: 'selling',
        permissions: [Permission.VIEW_FINANCES],
    },
    {
        value: 'revenue',
        group: 'selling',
        permissions: [Permission.VIEW_FINANCES],
    },
    {
        value: 'schedule',
        group: 'schedule',
        permissions: ORDER_READ_PERMISSIONS,
    },
    {
        value: 'replacements',
        group: 'schedule',
        permissions: SHIFT_READ_PERMISSIONS,
    },
    {
        value: 'members',
        group: 'team',
        permissions: [Permission.MANAGE_MEMBERS],
    },
    {
        value: 'tasks',
        group: 'team',
        permissions: [Permission.VIEW_MEMBERS],
    },
    {
        value: 'integrations',
        group: 'other',
        permissions: [Permission.MANAGE_INTEGRATIONS],
    },
];

export function canOpenProjectTab(
    tab: ProjectTabMeta,
    granted: Permission[],
): boolean {
    return hasPermission(granted, tab.permissions);
}

interface RoleStartTab {
    granted: Permission;
    missing: Permission;
    tab: string;
}

const ROLE_START_TABS: RoleStartTab[] = [
    {
        granted: Permission.MANAGE_OWN_DELIVERIES,
        missing: Permission.MANAGE_DELIVERIES,
        tab: 'deliveries',
    },
    {
        granted: Permission.VIEW_FINANCES,
        missing: Permission.MANAGE_CATALOG,
        tab: 'revenue',
    },
];

export function projectStartTab(
    granted: Permission[],
): ProjectTabMeta | undefined {
    const preferred = ROLE_START_TABS.find(
        (rule) =>
            granted.includes(rule.granted) && !granted.includes(rule.missing),
    )?.tab;

    const available = PROJECT_TAB_META.filter((tab) =>
        canOpenProjectTab(tab, granted),
    );

    return available.find((tab) => tab.value === preferred) ?? available[0];
}

export function groupedProjectTabs(granted: Permission[]): {
    group: TabGroup;
    tabs: ProjectTabMeta[];
}[] {
    return TAB_GROUP_ORDER.map((group) => ({
        group,
        tabs: PROJECT_TAB_META.filter(
            (tab) => tab.group === group && canOpenProjectTab(tab, granted),
        ),
    })).filter((section) => section.tabs.length > 0);
}
