import 'server-only';

import { db } from '@/infrastructure/database/client';
import { decryptCredentials } from '@/shared/security/encryption';
import { and, desc, eq } from 'drizzle-orm';
import { type StorageBucket, StorageBucketSchema } from './Integration.schema';
import { IntegrationType } from './Integration.types';
import { projectIntegrations } from './Integrations.table';

export async function findProjectBucket(
    projectId: string,
): Promise<StorageBucket | undefined> {
    const [row] = await db
        .select({ credentials: projectIntegrations.credentials })
        .from(projectIntegrations)
        .where(
            and(
                eq(projectIntegrations.projectId, projectId),
                eq(projectIntegrations.type, IntegrationType.STORAGE),
                eq(projectIntegrations.isActive, true),
            ),
        )
        .orderBy(desc(projectIntegrations.createdAt))
        .limit(1);

    if (!row?.credentials) return undefined;

    const parsed = StorageBucketSchema.safeParse(
        decryptCredentials(row.credentials),
    );

    return parsed.success ? parsed.data : undefined;
}
