import 'server-only';

import { HTTP } from '@/shared/constants/http';
import { decryptFile, encryptFile } from '@/shared/security/encryption';
import { findProjectBucket } from '@/contexts/integration/Integration.lib';
import type { StorageBucket } from '@/contexts/integration/Integration.schema';
import { env } from '@/env';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import {
    DeleteObjectCommand,
    GetObjectCommand,
    HeadObjectCommand,
    PutObjectCommand,
    S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { CHAT_SEGMENT } from './uploadUrls';

const UPLOADS_ROOT = env.UPLOADS_DIR
    ? path.resolve(env.UPLOADS_DIR)
    : path.join(process.cwd(), 'uploads');

const SIGNED_URL_SECONDS = 60 * 60;

const PLATFORM_BUCKET: StorageBucket | undefined =
    env.AWS_ENDPOINT_URL_S3 &&
    env.AWS_ACCESS_KEY_ID &&
    env.AWS_SECRET_ACCESS_KEY &&
    env.S3_BUCKET
        ? {
              endpoint: env.AWS_ENDPOINT_URL_S3,
              region: env.AWS_REGION ?? 'auto',
              bucket: env.S3_BUCKET,
              accessKeyId: env.AWS_ACCESS_KEY_ID,
              secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
          }
        : undefined;

interface StoragePlace {
    bucket?: StorageBucket;
    key: string;
    encrypted: boolean;
}

const s3Client = (bucket: StorageBucket): S3Client => {
    return new S3Client({
        endpoint: bucket.endpoint,
        region: bucket.region,
        credentials: {
            accessKeyId: bucket.accessKeyId,
            secretAccessKey: bucket.secretAccessKey,
        },
        forcePathStyle: true,
    });
};

const platformPlaces = (key: string): StoragePlace[] => {
    const disk = { key, encrypted: true };

    return PLATFORM_BUCKET
        ? [{ bucket: PLATFORM_BUCKET, key, encrypted: true }, disk]
        : [disk];
};

const projectPlaces = async (
    organizationId: string,
    projectId: string,
    filename: string,
): Promise<StoragePlace[]> => {
    const own = await findProjectBucket(projectId);

    const platform = platformPlaces(
        `organizations/${organizationId}/projects/${projectId}/${filename}`,
    );

    return own
        ? [{ bucket: own, key: filename, encrypted: false }, ...platform]
        : platform;
};

const chatPlaces = (
    organizationId: string,
    channelId: string,
    filename: string,
): StoragePlace[] => {
    return platformPlaces(
        `organizations/${organizationId}/${CHAT_SEGMENT}/${channelId}/${filename}`,
    );
};

const saveFile = async (
    [place]: StoragePlace[],
    data: Uint8Array,
    contentType: string,
): Promise<void> => {
    if (!place) return;

    const body = place.encrypted ? encryptFile(data) : data;

    if (place.bucket) {
        await s3Client(place.bucket).send(
            new PutObjectCommand({
                Bucket: place.bucket.bucket,
                Key: place.key,
                Body: body,
                ContentType: place.encrypted
                    ? 'application/octet-stream'
                    : contentType,
            }),
        );

        return;
    }

    const target = path.join(UPLOADS_ROOT, place.key);

    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, body);
};

const signedUrl = async (
    place: StoragePlace & { bucket: StorageBucket },
    contentType: string,
    disposition: string,
): Promise<string | undefined> => {
    const s3 = s3Client(place.bucket);
    const target = { Bucket: place.bucket.bucket, Key: place.key };

    const exists = await s3.send(new HeadObjectCommand(target)).then(
        () => true,
        () => false,
    );

    if (!exists) return undefined;

    return getSignedUrl(
        s3,
        new GetObjectCommand({
            ...target,
            ResponseContentType: contentType,
            ResponseContentDisposition: disposition,
        }),
        { expiresIn: SIGNED_URL_SECONDS },
    );
};

const readFileBytes = async (
    place: StoragePlace,
): Promise<Uint8Array | undefined> => {
    if (!place.bucket) {
        return readFile(path.join(UPLOADS_ROOT, place.key)).catch(
            () => undefined,
        );
    }

    const object = await s3Client(place.bucket)
        .send(
            new GetObjectCommand({
                Bucket: place.bucket.bucket,
                Key: place.key,
            }),
        )
        .catch(() => undefined);

    return object?.Body?.transformToByteArray();
};

const fileResponse = async (
    places: StoragePlace[],
    contentType: string,
    disposition: string,
): Promise<Response> => {
    for (const place of places) {
        if (place.bucket && !place.encrypted) {
            const url = await signedUrl(
                { ...place, bucket: place.bucket },
                contentType,
                disposition,
            );

            if (!url) continue;

            return new Response(null, {
                status: HTTP.FOUND,
                headers: {
                    Location: url,
                    'Cache-Control': 'private, max-age=3000',
                },
            });
        }

        const stored = await readFileBytes(place);

        if (!stored) continue;

        const file = decryptFile(stored);

        return new Response(new Uint8Array(file), {
            headers: {
                'Content-Type': contentType,
                'Content-Length': String(file.byteLength),
                'Cache-Control': 'private, max-age=31536000, immutable',
                'X-Content-Type-Options': 'nosniff',
                'Content-Disposition': disposition,
            },
        });
    }

    return new Response('Not found', { status: HTTP.NOT_FOUND });
};

const deleteFile = async (places: StoragePlace[]): Promise<void> => {
    for (const place of places) {
        if (place.bucket) {
            await s3Client(place.bucket).send(
                new DeleteObjectCommand({
                    Bucket: place.bucket.bucket,
                    Key: place.key,
                }),
            );
        } else {
            await rm(path.join(UPLOADS_ROOT, place.key), { force: true });
        }
    }
};

export const saveProjectFile = async (
    organizationId: string,
    projectId: string,
    filename: string,
    data: Uint8Array,
    contentType: string,
): Promise<void> => {
    await saveFile(
        await projectPlaces(organizationId, projectId, filename),
        data,
        contentType,
    );
};

export const projectFileResponse = async (
    organizationId: string,
    projectId: string,
    filename: string,
    contentType: string,
): Promise<Response> => {
    return fileResponse(
        await projectPlaces(organizationId, projectId, filename),
        contentType,
        'inline',
    );
};

export const deleteProjectFile = async (
    organizationId: string,
    projectId: string,
    filename: string,
): Promise<void> => {
    await deleteFile(await projectPlaces(organizationId, projectId, filename));
};

export const saveChatFile = async (
    organizationId: string,
    channelId: string,
    filename: string,
    data: Uint8Array,
    contentType: string,
): Promise<void> => {
    await saveFile(
        chatPlaces(organizationId, channelId, filename),
        data,
        contentType,
    );
};

export const chatFileResponse = async (
    organizationId: string,
    channelId: string,
    filename: string,
    contentType: string,
    disposition: string,
): Promise<Response> => {
    return fileResponse(
        chatPlaces(organizationId, channelId, filename),
        contentType,
        disposition,
    );
};

export const checkBucket = async (bucket: StorageBucket): Promise<void> => {
    const s3 = s3Client(bucket);
    const key = '.flowsy-check';

    await s3.send(
        new PutObjectCommand({ Bucket: bucket.bucket, Key: key, Body: 'ok' }),
    );

    await s3.send(new DeleteObjectCommand({ Bucket: bucket.bucket, Key: key }));
};
