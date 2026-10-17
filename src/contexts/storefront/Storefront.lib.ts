import 'server-only';

import { db } from '@/infrastructure/database/client';
import {
    parseUploadSegments,
    projectFileResponse,
} from '@/infrastructure/storage/uploads';
import { isApplicationError } from '@/shared/api/errors';
import { BEARER_PREFIX, HTTP } from '@/shared/constants/http';
import { getErrorMessage } from '@/shared/lib/errors';
import { isPublicHttpUrl } from '@/shared/security/public-url';
import {
    enforceRateLimit,
    RateLimitError,
    type RateLimitKey,
} from '@/shared/security/rate-limit';
import {
    INTEGRATION_API_KEY_PREFIX,
    IntegrationType,
} from '@/contexts/integration/Integration.types';
import { projectIntegrations } from '@/contexts/integration/Integrations.table';
import { getProject } from '@/contexts/project/Project.lib';
import { projects } from '@/contexts/project/Projects.table';
import { env } from '@/env';
import { createHash, createHmac } from 'node:crypto';
import { constantTimeEqual } from 'better-auth/crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { unstable_rethrow } from 'next/navigation';
import * as z from 'zod/mini';
import {
    STOREFRONT_IMAGES_PATH,
    STOREFRONT_REVALIDATE_PATH,
    STOREFRONT_SIGNATURE_HEADER,
    type StorefrontAccess,
} from './Storefront.types';

const REVALIDATE_TIMEOUT_MS = 5000;

export class StorefrontAuthError extends Error {}

export class StorefrontNotFoundError extends Error {}

class StorefrontValidationError extends Error {}

function storefrontSignature(value: string): string {
    return createHmac('sha256', env.AUTH_SECRET).update(value).digest('hex');
}

export function isValidStorefrontSignature(
    value: string,
    signature: string,
): boolean {
    return constantTimeEqual(storefrontSignature(value), signature);
}

export function storefrontImageUrl(
    projectId: string,
    filename: string,
): string {
    const params = new URLSearchParams({
        projectId,
        signature: storefrontSignature(`${projectId}:${filename}`),
    });

    const apiUrl = (env.NEXT_PUBLIC_API_URL ?? env.NEXT_PUBLIC_APP_URL).replace(
        /\/+$/,
        '',
    );

    return `${apiUrl}${STOREFRONT_IMAGES_PATH}/${filename}?${params}`;
}

export async function authenticateStorefront(
    request: Request,
    rateLimit: RateLimitKey,
): Promise<StorefrontAccess> {
    const header = request.headers.get('authorization') ?? '';

    const token = header.startsWith(BEARER_PREFIX)
        ? header.slice(BEARER_PREFIX.length).trim()
        : '';

    if (!token.startsWith(INTEGRATION_API_KEY_PREFIX)) {
        throw new StorefrontAuthError(
            'Нужен заголовок Authorization: Bearer <ключ витрины>',
        );
    }

    const hash = createHash('sha256').update(token).digest('hex');

    const [access] = await db
        .select({
            integrationId: projectIntegrations.id,
            projectId: projects.id,
            organizationId: projects.organizationId,
            projectName: projects.name,
            currency: projects.defaultCurrency,
        })
        .from(projectIntegrations)
        .innerJoin(projects, eq(projects.id, projectIntegrations.projectId))
        .where(
            and(
                eq(projectIntegrations.apiKeyHash, hash),
                eq(projectIntegrations.type, IntegrationType.STOREFRONT),
                eq(projectIntegrations.isActive, true),
                isNull(projects.deletedAt),
            ),
        )
        .limit(1);

    if (!access) {
        throw new StorefrontAuthError('Ключ витрины не найден или отозван');
    }

    enforceRateLimit(rateLimit, access.integrationId);

    return access;
}

export async function revalidateStorefronts(projectId: string): Promise<void> {
    const sites = await db
        .select({
            siteUrl: projectIntegrations.siteUrl,
            apiKeyHash: projectIntegrations.apiKeyHash,
        })
        .from(projectIntegrations)
        .where(
            and(
                eq(projectIntegrations.projectId, projectId),
                eq(projectIntegrations.type, IntegrationType.STOREFRONT),
                eq(projectIntegrations.isActive, true),
            ),
        );

    await Promise.allSettled(
        sites.map(async ({ siteUrl, apiKeyHash }) => {
            if (!siteUrl || !apiKeyHash) return;
            if (!(await isPublicHttpUrl(siteUrl))) return;

            await fetch(
                `${siteUrl.replace(/\/+$/, '')}${STOREFRONT_REVALIDATE_PATH}`,
                {
                    method: 'POST',
                    redirect: 'manual',
                    headers: { [STOREFRONT_SIGNATURE_HEADER]: apiKeyHash },
                    signal: AbortSignal.timeout(REVALIDATE_TIMEOUT_MS),
                },
            );
        }),
    );
}

export async function parseStorefrontBody<T>(
    request: Request,
    schema: z.ZodMiniType<T>,
): Promise<T> {
    let body: unknown;

    try {
        body = await request.json();
    } catch {
        throw new StorefrontValidationError('Тело запроса — не JSON');
    }

    const parsed = z.safeParse(schema, body);

    if (!parsed.success) {
        throw new StorefrontValidationError(z.prettifyError(parsed.error));
    }

    return parsed.data;
}

export function storefrontErrorResponse(error: unknown): Response {
    unstable_rethrow(error);
    const message = getErrorMessage(error);

    const status =
        error instanceof StorefrontAuthError
            ? HTTP.UNAUTHORIZED
            : error instanceof RateLimitError
              ? HTTP.TOO_MANY_REQUESTS
              : error instanceof StorefrontNotFoundError
                ? HTTP.NOT_FOUND
                : error instanceof StorefrontValidationError
                  ? HTTP.UNPROCESSABLE_ENTITY
                  : isApplicationError(error)
                    ? HTTP.BAD_REQUEST
                    : null;

    if (status !== null) {
        return Response.json({ error: message }, { status });
    }

    console.error('Storefront API error:', message);

    return Response.json(
        { error: 'Внутренняя ошибка' },
        { status: HTTP.INTERNAL_SERVER_ERROR },
    );
}

export async function storefrontResponse(
    work: () => Promise<unknown>,
    successStatus: number = HTTP.OK,
): Promise<Response> {
    try {
        return Response.json(await work(), { status: successStatus });
    } catch (error) {
        return storefrontErrorResponse(error);
    }
}

export async function storefrontImageResponse(
    projectId: string,
    filename: string,
): Promise<Response> {
    const location = parseUploadSegments([projectId, filename]);

    const project =
        location?.kind === 'project' ? await getProject(projectId) : undefined;

    if (location?.kind !== 'project' || !project) {
        throw new StorefrontNotFoundError('Файл не найден');
    }

    return projectFileResponse(
        project.organizationId,
        projectId,
        filename,
        location.contentType,
    );
}
