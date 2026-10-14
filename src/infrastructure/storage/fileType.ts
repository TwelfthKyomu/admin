import { fileTypeFromBuffer } from 'file-type';

export interface FileType {
    ext: string;
    contentType: string;
    isImage: boolean;
}

const IMAGE_TYPES: ReadonlySet<string> = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
]);

const DOCUMENT_TYPES: ReadonlySet<string> = new Set([
    'application/pdf',
    'application/zip',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
]);

const LEGACY_OFFICE_TYPES: Record<string, string> = {
    doc: 'application/msword',
    xls: 'application/vnd.ms-excel',
};

const TEXT_TYPES: Record<string, string> = {
    txt: 'text/plain; charset=utf-8',
    csv: 'text/csv; charset=utf-8',
};

function extensionOf(name: string): string {
    return name.includes('.')
        ? (name.split('.').pop() ?? '').toLowerCase()
        : '';
}

function isUtf8Text(bytes: Uint8Array): boolean {
    if (bytes.includes(0)) return false;

    try {
        new TextDecoder('utf-8', { fatal: true }).decode(bytes);

        return true;
    } catch {
        return false;
    }
}

export async function detectFileType(
    bytes: Uint8Array,
    name: string,
): Promise<FileType | null> {
    const detected = await fileTypeFromBuffer(bytes);
    const ext = extensionOf(name);

    if (detected && IMAGE_TYPES.has(detected.mime)) {
        return { ext: detected.ext, contentType: detected.mime, isImage: true };
    }
    if (detected && DOCUMENT_TYPES.has(detected.mime)) {
        return {
            ext: detected.ext,
            contentType: detected.mime,
            isImage: false,
        };
    }

    const legacy =
        detected?.ext === 'cfb' ? LEGACY_OFFICE_TYPES[ext] : undefined;

    const text = detected ? undefined : TEXT_TYPES[ext];

    if (legacy) return { ext, contentType: legacy, isImage: false };
    if (text && isUtf8Text(bytes)) {
        return { ext, contentType: text, isImage: false };
    }

    return null;
}

export async function detectImageType(
    bytes: Uint8Array,
): Promise<FileType | null> {
    const type = await detectFileType(bytes, '');

    return type?.isImage ? type : null;
}
