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

const UPLOADS_ROOT = env.UPLOADS_DIR
    ? path.resolve(env.UPLOADS_DIR)
    : path.join(process.cwd(), 'uploads');

const UPLOAD_URL_PREFIX = '/files';
const CHAT_SEGMENT = 'chat';
const SIGNED_URL_SECONDS = 60 * 60;

const ID_PATTERN = /^[a-f0-9-]{36}$/i;
const PROJECT_FILENAME_PATTERN = /^[a-f0-9]{24}\.(jpg|png|gif|webp)$/;
const CHAT_FILENAME_PATTERN = /^[a-f0-9]{24}\.[a-z0-9]{1,5}$/;

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
    jpg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
};

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

export type UploadLocation =
    | {
          kind: 'project';
          projectId: string;
          filename: string;
          contentType: string;
      }
    | { kind: 'chat'; channelId: string; filename: string };

export function parseUploadSegments(
    segments: readonly string[],
): UploadLocation | null {
    if (segments.length === 3 && segments[0] === CHAT_SEGMENT) {
        const [, channelId, filename] = segments;

        if (!channelId || !ID_PATTERN.test(channelId)) return null;
        if (!filename || !CHAT_FILENAME_PATTERN.test(filename)) return null;

        return { kind: 'chat', channelId, filename };
    }

    if (segments.length !== 2) return null;

    const [projectId, filename] = segments;

    if (!projectId || !ID_PATTERN.test(projectId)) return null;
    if (!filename || !PROJECT_FILENAME_PATTERN.test(filename)) return null;

    const ext = filename.slice(filename.lastIndexOf('.') + 1);
    const contentType = CONTENT_TYPE_BY_EXT[ext];

    if (!contentType) return null;

    return { kind: 'project', projectId, filename, contentType };
}

export function uploadUrl(projectId: string, filename: string): string {
    return `${UPLOAD_URL_PREFIX}/${projectId}/${filename}`;
}

export function parseUploadUrl(url: string): UploadLocation | null {
    if (!url.startsWith(`${UPLOAD_URL_PREFIX}/`)) return null;

    return parseUploadSegments(
        url.slice(UPLOAD_URL_PREFIX.length + 1).split('/'),
    );
}

export function chatUploadUrl(channelId: string, filename: string): string {
    return `${UPLOAD_URL_PREFIX}/${CHAT_SEGMENT}/${channelId}/${filename}`;
}

interface StoragePlace {
    bucket?: StorageBucket;
    key: string;
    encrypted: boolean;
}

function s3Client(bucket: StorageBucket): S3Client {
    return new S3Client({
        endpoint: bucket.endpoint,
        region: bucket.region,
        credentials: {
            accessKeyId: bucket.accessKeyId,
            secretAccessKey: bucket.secretAccessKey,
        },
        forcePathStyle: true,
    });
}

function platformPlaces(key: string): StoragePlace[] {
    const disk = { key, encrypted: true };

    return PLATFORM_BUCKET
        ? [{ bucket: PLATFORM_BUCKET, key, encrypted: true }, disk]
        : [disk];
}

async function projectPlaces(
    organizationId: string,
    projectId: string,
    filename: string,
): Promise<StoragePlace[]> {
    const own = await findProjectBucket(projectId);

    const platform = platformPlaces(
        `organizations/${organizationId}/projects/${projectId}/${filename}`,
    );

    return own
        ? [{ bucket: own, key: filename, encrypted: false }, ...platform]
        : platform;
}

function chatPlaces(
    organizationId: string,
    channelId: string,
    filename: string,
): StoragePlace[] {
    return platformPlaces(
        `organizations/${organizationId}/${CHAT_SEGMENT}/${channelId}/${filename}`,
    );
}

async function saveFile(
    [place]: StoragePlace[],
    data: Uint8Array,
    contentType: string,
): Promise<void> {
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
}

async function signedUrl(
    place: StoragePlace & { bucket: StorageBucket },
    contentType: string,
    disposition: string,
): Promise<string | undefined> {
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
}

async function readFileBytes(
    place: StoragePlace,
): Promise<Uint8Array | undefined> {
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
}

async function fileResponse(
    places: StoragePlace[],
    contentType: string,
    disposition: string,
): Promise<Response> {
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
}

async function deleteFile(places: StoragePlace[]): Promise<void> {
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
}

export async function saveProjectFile(
    organizationId: string,
    projectId: string,
    filename: string,
    data: Uint8Array,
    contentType: string,
): Promise<void> {
    await saveFile(
        await projectPlaces(organizationId, projectId, filename),
        data,
        contentType,
    );
}

export async function projectFileResponse(
    organizationId: string,
    projectId: string,
    filename: string,
    contentType: string,
): Promise<Response> {
    return fileResponse(
        await projectPlaces(organizationId, projectId, filename),
        contentType,
        'inline',
    );
}

export async function deleteProjectFile(
    organizationId: string,
    projectId: string,
    filename: string,
): Promise<void> {
    await deleteFile(await projectPlaces(organizationId, projectId, filename));
}

export async function saveChatFile(
    organizationId: string,
    channelId: string,
    filename: string,
    data: Uint8Array,
    contentType: string,
): Promise<void> {
    await saveFile(
        chatPlaces(organizationId, channelId, filename),
        data,
        contentType,
    );
}

export async function chatFileResponse(
    organizationId: string,
    channelId: string,
    filename: string,
    contentType: string,
    disposition: string,
): Promise<Response> {
    return fileResponse(
        chatPlaces(organizationId, channelId, filename),
        contentType,
        disposition,
    );
}

export async function checkBucket(bucket: StorageBucket): Promise<void> {
    const s3 = s3Client(bucket);
    const key = '.flowsy-check';

    await s3.send(
        new PutObjectCommand({ Bucket: bucket.bucket, Key: key, Body: 'ok' }),
    );

    await s3.send(new DeleteObjectCommand({ Bucket: bucket.bucket, Key: key }));
}
