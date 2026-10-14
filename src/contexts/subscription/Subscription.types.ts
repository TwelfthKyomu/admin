import { enumValues } from '@/shared/lib/enum';

export const SubscriptionPlan = {
    FREE: 'free',
    PRO: 'pro',
    ENTERPRISE: 'enterprise',
} as const;

export type SubscriptionPlan =
    (typeof SubscriptionPlan)[keyof typeof SubscriptionPlan];

export const SUBSCRIPTION_PLAN_VALUES = enumValues(SubscriptionPlan);

export const BillingPaymentStatus = {
    PENDING: 'pending',
    PAID: 'paid',
    CANCELLED: 'cancelled',
} as const;

export type BillingPaymentStatus =
    (typeof BillingPaymentStatus)[keyof typeof BillingPaymentStatus];

export const BILLING_PAYMENT_STATUS_VALUES = enumValues(BillingPaymentStatus);

export const BillingPeriod = {
    MONTH: 'month',
    YEAR: 'year',
} as const;

export type BillingPeriod = (typeof BillingPeriod)[keyof typeof BillingPeriod];

export const BILLING_PERIOD_VALUES = enumValues(BillingPeriod);

export const BILLING_PERIOD_DAYS: Record<BillingPeriod, number> = {
    [BillingPeriod.MONTH]: 30,
    [BillingPeriod.YEAR]: 365,
};

export const BILLING_PERIOD_LABEL: Record<BillingPeriod, string> = {
    [BillingPeriod.MONTH]: 'месяц',
    [BillingPeriod.YEAR]: 'год',
};

export interface PlanLimits {
    projects: number;
    productsPerProject: number;
    badgesPerProject: number;
    storageBytes: number;
}

const MB = 1024 * 1024;

export const LIMITS_BY_PLAN: Record<SubscriptionPlan, PlanLimits> = {
    [SubscriptionPlan.FREE]: {
        projects: 1,
        productsPerProject: 50,
        badgesPerProject: 10,
        storageBytes: 500 * MB,
    },
    [SubscriptionPlan.PRO]: {
        projects: 5,
        productsPerProject: 5_000,
        badgesPerProject: 100,
        storageBytes: 5 * 1024 * MB,
    },
    [SubscriptionPlan.ENTERPRISE]: {
        projects: 20,
        productsPerProject: 50_000,
        badgesPerProject: 500,
        storageBytes: 50 * 1024 * MB,
    },
};

export interface PlanInfo {
    label: string;
    price: Record<BillingPeriod, number>;
    tagline: string;
}

export const PLAN_CATALOG: Record<SubscriptionPlan, PlanInfo> = {
    [SubscriptionPlan.FREE]: {
        label: 'Free',
        price: { month: 0, year: 0 },
        tagline: 'Для старта: один проект',
    },
    [SubscriptionPlan.PRO]: {
        label: 'Pro',
        price: { month: 99_000, year: 990_000 },
        tagline: 'Для растущего бизнеса: до 5 проектов',
    },
    [SubscriptionPlan.ENTERPRISE]: {
        label: 'Enterprise',
        price: { month: 499_000, year: 4_990_000 },
        tagline: 'Для сетей и нескольких брендов: до 20 проектов',
    },
};

export interface OrganizationSubscriptionStatus {
    plan: SubscriptionPlan;
    planExpiresAt: Date | null;
    billingEnabled: boolean;
    projectsUsed: number;
    projectLimit: number;
    canCreateProject: boolean;
    storageUsedBytes: number;
    storageLimitBytes: number;
}
