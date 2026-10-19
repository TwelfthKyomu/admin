import {
    canInOrg,
    OrganizationRole,
} from '@/contexts/organizationMember/OrganizationMember.types';
import { Permission } from '@/contexts/user/User.types';
import { describe, expect, it } from 'vitest';
import {
    canInProject,
    PROJECT_ROLE_VALUES,
    ProjectRole,
} from './Project.types';

describe('права на деньги', () => {
    it('проводить оплаты и выплаты могут только управляющий и бухгалтер проекта', () => {
        for (const role of [ProjectRole.MANAGER, ProjectRole.ACCOUNTANT]) {
            expect(canInProject(role, Permission.MANAGE_FINANCES)).toBe(true);
        }

        for (const role of [
            ProjectRole.EDITOR,
            ProjectRole.VIEWER,
            ProjectRole.COURIER,
        ]) {
            expect(canInProject(role, Permission.MANAGE_FINANCES)).toBe(false);
        }
    });

    it('тариф оплачивают владелец и администратор организации', () => {
        expect(
            canInOrg(OrganizationRole.OWNER, Permission.MANAGE_BILLING),
        ).toBe(true);

        expect(
            canInOrg(OrganizationRole.ADMIN, Permission.MANAGE_BILLING),
        ).toBe(true);

        expect(
            canInOrg(OrganizationRole.MEMBER, Permission.MANAGE_BILLING),
        ).toBe(false);
    });

    it('курьер не видит финансы проекта', () => {
        expect(
            canInProject(ProjectRole.COURIER, Permission.VIEW_FINANCES),
        ).toBe(false);
    });
});

describe('права на заказы', () => {
    it('продавец управляет заказами, наблюдатель только смотрит', () => {
        expect(canInProject(ProjectRole.EDITOR, Permission.MANAGE_ORDERS)).toBe(
            true,
        );

        expect(canInProject(ProjectRole.VIEWER, Permission.VIEW_ORDERS)).toBe(
            true,
        );

        expect(canInProject(ProjectRole.VIEWER, Permission.MANAGE_ORDERS)).toBe(
            false,
        );
    });
});

describe('роли проекта', () => {
    it('роли «мастер» больше нет', () => {
        expect(PROJECT_ROLE_VALUES).not.toContain('master');
    });
});
