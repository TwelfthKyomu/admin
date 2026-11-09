import 'server-only';

const UPLOAD_URL_PREFIX = '/files';

export const CHAT_SEGMENT = 'chat';

const ID_PATTERN = /^[a-f0-9-]{36}$/i;

const PROJECT_FILENAME_PATTERN = /^[a-f0-9]{24}\.(jpg|png|gif|webp)$/;

const CHAT_FILENAME_PATTERN = /^[a-f0-9]{24}\.[a-z0-9]{1,5}$/;

const CONTENT_TYPE_BY_EXT: Record<string, string> = {
    jpg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
};

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
