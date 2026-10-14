import { LABEL_MAX } from '@/shared/constants/default';
import {
    idSchema,
    optionalText,
    projectScopeSchema,
} from '@/shared/validation/base';
import * as z from 'zod/mini';

export const IntegrationsActionInputSchema = projectScopeSchema;

export const CreateIntegrationActionInputSchema = z.object({
    projectId: idSchema,
    name: z.string().check(z.minLength(1), z.maxLength(LABEL_MAX)),
    siteUrl: optionalText(z.url()),
});

export const RevokeIntegrationActionInputSchema = z.object({
    projectId: idSchema,
    integrationId: idSchema,
});

export const StorageBucketSchema = z.object({
    endpoint: z.url(),
    region: z.string().check(z.trim(), z.minLength(1)),
    bucket: z.string().check(z.trim(), z.minLength(1)),
    accessKeyId: z.string().check(z.trim(), z.minLength(1)),
    secretAccessKey: z.string().check(z.trim(), z.minLength(1)),
});

export type StorageBucket = z.infer<typeof StorageBucketSchema>;

export const ConnectStorageActionInputSchema = z.extend(StorageBucketSchema, {
    projectId: idSchema,
    name: z.string().check(z.trim(), z.minLength(1), z.maxLength(LABEL_MAX)),
});
