import {
    canInOrg,
    OrganizationRole,
} from '@/contexts/organizationMember/OrganizationMember.types';
import { Permission } from '@/contexts/user/User.types';
import { describe, expect, it } from 'vitest';
import { canInProject, ProjectRole } from './Project.types';

describe('права на деньги', () => {
    it('проводить оплаты и выплаты могут только управляющий и бухгалтер проекта', () => {
        for (const role of [ProjectRole.MANAGER, ProjectRole.ACCOUNTANT]) {
            expect(canInProject(role, Permission.MANAGE_FINANCES)).toBe(true);
        }

        for (const role of [
            ProjectRole.EDITOR,
            ProjectRole.VIEWER,
            ProjectRole.MASTER,
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
