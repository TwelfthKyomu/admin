'use server';

import { db } from '@/infrastructure/database/client';
import { checkBucket } from '@/infrastructure/storage/uploads';
import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { insertOne, updateInProject } from '@/shared/api/repository';
import { getErrorMessage } from '@/shared/lib/errors';
import { encryptCredentials } from '@/shared/security/encryption';
import { isPublicHttpUrl } from '@/shared/security/public-url';
import { recordAudit } from '@/contexts/auditLog/AuditLog.lib';
import {
    AuditAction,
    AuditTargetType,
} from '@/contexts/auditLog/AuditLog.types';
import {
    INTEGRATION_READ_PERMISSIONS,
    Permission,
} from '@/contexts/user/User.types';
import { createHash, randomBytes } from 'node:crypto';
import { asc, eq } from 'drizzle-orm';
import { findProjectBucket } from './Integration.lib';
import {
    ConnectStorageActionInputSchema,
    CreateIntegrationActionInputSchema,
    IntegrationsActionInputSchema,
    RevokeIntegrationActionInputSchema,
} from './Integration.schema';
import {
    INTEGRATION_API_KEY_ENTROPY_BYTES,
    INTEGRATION_API_KEY_PREFIX,
    IntegrationType,
    type IntegrationView,
} from './Integration.types';
import {
    type ProjectIntegrationRecord,
    projectIntegrations,
} from './Integrations.table';

function rowToView(integration: ProjectIntegrationRecord): IntegrationView {
    return {
        id: integration.id,
        name: integration.name,
        siteUrl: integration.siteUrl,
        type: integration.type,
        isActive: integration.isActive,
        apiKeyPrefix: integration.apiKeyPrefix,
        createdAt: integration.createdAt,
    };
}

export const integrationsAction = projectReadAction(
    INTEGRATION_READ_PERMISSIONS,
)
    .inputSchema(IntegrationsActionInputSchema)
    .action(async ({ parsedInput: { projectId } }) => {
        const rows = await db
            .select()
            .from(projectIntegrations)
            .where(eq(projectIntegrations.projectId, projectId))
            .orderBy(asc(projectIntegrations.createdAt));

        return rows.map(rowToView);
    });

export const createIntegrationAction = projectMutationAction(
    Permission.MANAGE_INTEGRATIONS,
)
    .inputSchema(CreateIntegrationActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId, organizationId } }) => {
        if (
            parsedInput.siteUrl &&
            !(await isPublicHttpUrl(parsedInput.siteUrl))
        ) {
            throw new ApplicationError(
                'Адрес сайта должен быть публичным: локальные и внутренние адреса не подходят',
            );
        }

        const secret = randomBytes(INTEGRATION_API_KEY_ENTROPY_BYTES).toString(
            'base64url',
        );

        const token = `${INTEGRATION_API_KEY_PREFIX}${secret}`;

        const integration = await insertOne(
            projectIntegrations,
            {
                projectId: parsedInput.projectId,
                name: parsedInput.name,
                siteUrl: parsedInput.siteUrl ?? null,
                type: IntegrationType.STOREFRONT,
                apiKeyPrefix: token.slice(0, 16),
                apiKeyHash: createHash('sha256').update(token).digest('hex'),
                isActive: true,
            },
            'Не удалось создать интеграцию',
        );

        await recordAudit({
            organizationId,
            projectId: parsedInput.projectId,
            actorUserId: userId,
            action: AuditAction.ApiKeyIssued,
            targetType: AuditTargetType.Integration,
            targetId: integration.id,
            summary: `Выпущен API-ключ «${parsedInput.name}»`,
            metadata: { name: parsedInput.name },
        });

        return {
            integration: rowToView(integration),
            plaintextKey: token,
        };
    });

export const revokeIntegrationAction = projectMutationAction(
    Permission.MANAGE_INTEGRATIONS,
)
    .inputSchema(RevokeIntegrationActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId, organizationId } }) => {
        await updateInProject(
            projectIntegrations,
            parsedInput.integrationId,
            parsedInput.projectId,
            { isActive: false },
            'Интеграция не найдена',
        );

        await recordAudit({
            organizationId,
            projectId: parsedInput.projectId,
            actorUserId: userId,
            action: AuditAction.ApiKeyRevoked,
            targetType: AuditTargetType.Integration,
            targetId: parsedInput.integrationId,
            summary: 'Отозван API-ключ',
        });

        return { ok: true };
    });

export const connectStorageAction = projectMutationAction(
    Permission.MANAGE_INTEGRATIONS,
    'storage:connect',
)
    .inputSchema(ConnectStorageActionInputSchema)
    .action(async ({ parsedInput: { projectId, name, ...bucket } }) => {
        if (await findProjectBucket(projectId)) {
            throw new ApplicationError(
                'У проекта уже подключено хранилище. Сначала отключите его.',
            );
        }

        if (!(await isPublicHttpUrl(bucket.endpoint))) {
            throw new ApplicationError(
                'Адрес хранилища должен быть публичным: локальные и внутренние адреса не подходят',
            );
        }

        await checkBucket(bucket).catch((error) => {
            throw new ApplicationError(
                `Хранилище не приняло тестовый файл (${error?.$metadata?.httpStatusCode ?? getErrorMessage(error)}). Проверьте ключи, бакет и что хранилище доступно с сервера.`,
            );
        });

        const integration = await insertOne(
            projectIntegrations,
            {
                projectId,
                name,
                type: IntegrationType.STORAGE,
                credentials: encryptCredentials(bucket),
                isActive: true,
            },
            'Не удалось подключить хранилище',
        );

        return rowToView(integration);
    });
