import { enumValues } from '@/shared/lib/enum';

export const SetupStep = {
    PRODUCTS: 'products',
    STOCK: 'stock',
    TEAM: 'team',
    PAYMENTS: 'payments',
    SITE: 'site',
    FIRST_SALE: 'first_sale',
} as const;

export type SetupStep = (typeof SetupStep)[keyof typeof SetupStep];

export const SETUP_STEP_VALUES = enumValues(SetupStep);

export interface ProjectSetupView {
    projectId: string;
    done: SetupStep[];
}

export const isSetupComplete = (setup: ProjectSetupView): boolean => {
    return SETUP_STEP_VALUES.every((step) => setup.done.includes(step));
};
