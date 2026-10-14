import { createdAt, id } from '@/infrastructure/database/columns';
import {
    integrationTypeEnum,
    paymentProviderEnum,
} from '@/infrastructure/database/schemas/enums';
import { projects } from '@/contexts/project/Projects.table';
import { isNotNull, sql } from 'drizzle-orm';
import {
    boolean,
    check,
    index,
    jsonb,
    pgTable,
    text,
    unique,
    uniqueIndex,
    varchar,
} from 'drizzle-orm/pg-core';
import { IntegrationType } from './Integration.types';

export const projectIntegrations = pgTable(
    'project_integrations',
    {
        id,
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        name: varchar('name', { length: 255 }).notNull(),
        siteUrl: text('site_url'),
        type: integrationTypeEnum('type')
            .notNull()
            .default(IntegrationType.STOREFRONT),
        apiKeyPrefix: varchar('api_key_prefix', { length: 16 }),
        apiKeyHash: text('api_key_hash'),
        provider: paymentProviderEnum('provider'),
        credentials: jsonb('credentials').$type<Record<string, unknown>>(),
        isActive: boolean('is_active').notNull().default(true),
        createdAt,
    },
    (t) => [
        unique('project_integrations_id_project_unique').on(t.id, t.projectId),
        uniqueIndex('project_integrations_project_name_unique').on(
            t.projectId,
            t.name,
        ),
        uniqueIndex('project_integrations_api_key_hash_unique')
            .on(t.apiKeyHash)
            .where(isNotNull(t.apiKeyHash)),
        index('project_integrations_project_idx').on(t.projectId),
        check(
            'project_integrations_api_key_shape',
            sql`(${t.apiKeyHash} is null) = (${t.apiKeyPrefix} is null) and (${t.apiKeyHash} is null or ${t.type} = 'storefront')`,
        ),
        check(
            'project_integrations_provider_shape',
            sql`(${t.type} = 'payment_provider') = (${t.provider} is not null and ${t.credentials} is not null)`,
        ),
    ],
);

export type ProjectIntegrationRecord = typeof projectIntegrations.$inferSelect;
