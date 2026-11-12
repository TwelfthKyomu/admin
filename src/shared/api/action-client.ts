import 'server-only';

import { getServerSession } from '@/infrastructure/auth/getServerSession';
import {
    ApplicationError,
    constraintErrorMessage,
    isApplicationError,
} from '@/shared/api/errors';
import {
    assertOrganizationRoleCan,
    requireProjectPermission,
    requireUserOrganization,
} from '@/shared/api/permission';
import { AUTH_REQUIRED_MESSAGE } from '@/shared/constants/auth';
import { getErrorMessage } from '@/shared/lib/errors';
import { publishScopeEvent } from '@/shared/realtime/scopeEvents';
import {
    enforceRateLimit,
    type RateLimitKey,
} from '@/shared/security/rate-limit';
import { revalidateStorefronts } from '@/contexts/storefront/Storefront.lib';
import type { PermissionRequirement } from '@/contexts/user/User.types';
import { after } from 'next/server';
import { createSafeActionClient } from 'next-safe-action';

const actionClient = createSafeActionClient({
    handleServerError(e: unknown) {
        if (isApplicationError(e)) return e.message;

        const constraintMessage = constraintErrorMessage(e);

        if (constraintMessage) return constraintMessage;

        console.error('Server action error:', getErrorMessage(e));

        return 'Непредвиденная ошибка сервера';
    },
});

export const authActionClient = actionClient.use(async ({ next }) => {
    const session = await getServerSession();

    if (!session?.user) throw new ApplicationError(AUTH_REQUIRED_MESSAGE);

    return next({ ctx: { userId: session.user.id, user: session.user } });
});

const inputValue = (clientInput: unknown, key: string): string | undefined => {
    if (!clientInput || typeof clientInput !== 'object') return undefined;

    const value = (clientInput as Record<string, unknown>)[key];

    return typeof value === 'string' && value ? value : undefined;
};

const withProjectGuard = (
    permission: PermissionRequirement,
    rateLimit?: RateLimitKey,
) => {
    return authActionClient.use(async ({ next, clientInput, ctx }) => {
        const projectId = inputValue(clientInput, 'projectId');

        if (!projectId) throw new ApplicationError('Не передан projectId');

        if (rateLimit) enforceRateLimit(rateLimit, ctx.userId);

        const { organizationId } = await requireProjectPermission(
            ctx.userId,
            projectId,
            permission,
        );

        return next({ ctx: { ...ctx, projectId, organizationId } });
    });
};

export const projectReadAction = (permission: PermissionRequirement) => {
    return withProjectGuard(permission);
};

export const projectMutationAction = (
    permission: PermissionRequirement,
    rateLimit: RateLimitKey = 'mutation',
) => {
    return withProjectGuard(permission, rateLimit).use(
        async ({ next, ctx }) => {
            const result = await next();

            if (result.success) {
                publishScopeEvent(ctx.projectId, {
                    type: 'sync',
                    userId: ctx.userId,
                });

                after(() => revalidateStorefronts(ctx.projectId));
            }

            return result;
        },
    );
};

const withOrganizationGuard = (
    permission?: PermissionRequirement,
    rateLimit?: RateLimitKey,
) => {
    return authActionClient.use(async ({ next, clientInput, ctx }) => {
        if (rateLimit) enforceRateLimit(rateLimit, ctx.userId);

        const organization = await requireUserOrganization(ctx.userId);

        const requested = inputValue(clientInput, 'organizationId');

        if (requested && requested !== organization.id) {
            throw new ApplicationError(
                'Организация не соответствует вашему аккаунту',
            );
        }

        if (permission) {
            assertOrganizationRoleCan(organization.role, permission);
        }

        return next({
            ctx: {
                ...ctx,
                organizationId: organization.id,
                role: organization.role,
            },
        });
    });
};

export const organizationMemberAction = () => {
    return withOrganizationGuard();
};

export const organizationMemberMutationAction = () => {
    return withOrganizationGuard(undefined, 'mutation');
};

export const organizationReadAction = (permission: PermissionRequirement) => {
    return withOrganizationGuard(permission);
};

export const organizationMutationAction = (
    permission: PermissionRequirement,
    rateLimit: RateLimitKey = 'mutation',
) => {
    return withOrganizationGuard(permission, rateLimit);
};
