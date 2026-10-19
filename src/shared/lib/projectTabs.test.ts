import {
    ProjectRole,
    projectRolePermissions,
} from '@/contexts/project/Project.types';
import { describe, expect, it } from 'vitest';
import { projectStartTab } from './projectTabs';

const startTab = (role: ProjectRole) =>
    projectStartTab(projectRolePermissions(role))?.value;

describe('стартовая вкладка проекта по роли', () => {
    it('курьер начинает с доставок', () => {
        expect(startTab(ProjectRole.COURIER)).toBe('deliveries');
    });

    it('бухгалтер начинает с выручки', () => {
        expect(startTab(ProjectRole.ACCOUNTANT)).toBe('revenue');
    });

    it('управляющий и продавец начинают с первой вкладки', () => {
        expect(startTab(ProjectRole.MANAGER)).toBe('products');
        expect(startTab(ProjectRole.EDITOR)).toBe('products');
    });
});
