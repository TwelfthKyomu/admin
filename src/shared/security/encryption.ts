import 'server-only';

import { env } from '@/env';
import {
    createCipheriv,
    createDecipheriv,
    hkdfSync,
    randomBytes,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const KEY = Buffer.from(env.ENCRYPTION_KEY, 'utf8');
const FILE_KEY = Buffer.from(hkdfSync('sha256', KEY, '', 'flowsy-files', 32));
const FILE_MAGIC = Buffer.from('FLW1');
const FILE_HEADER_BYTES = FILE_MAGIC.length + IV_BYTES + AUTH_TAG_BYTES;

export function encryptCredentials(
    payload: Record<string, unknown>,
): Record<string, unknown> {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, KEY, iv);

    const ciphertext = Buffer.concat([
        cipher.update(JSON.stringify(payload), 'utf8'),
        cipher.final(),
    ]);

    return {
        ciphertext: ciphertext.toString('base64'),
        iv: iv.toString('base64'),
        authTag: cipher.getAuthTag().toString('base64'),
    };
}

export function decryptCredentials(
    stored: Record<string, unknown>,
): Record<string, unknown> {
    const decipher = createDecipheriv(
        ALGORITHM,
        KEY,
        Buffer.from(String(stored.iv), 'base64'),
    );

    decipher.setAuthTag(Buffer.from(String(stored.authTag), 'base64'));

    const plaintext = Buffer.concat([
        decipher.update(Buffer.from(String(stored.ciphertext), 'base64')),
        decipher.final(),
    ]);

    return JSON.parse(plaintext.toString('utf8'));
}

export function encryptFile(data: Uint8Array): Buffer {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, FILE_KEY, iv);
    const body = Buffer.concat([cipher.update(data), cipher.final()]);

    return Buffer.concat([FILE_MAGIC, iv, cipher.getAuthTag(), body]);
}

export function decryptFile(data: Uint8Array): Uint8Array {
    const file = Buffer.from(data.buffer, data.byteOffset, data.byteLength);

    if (!file.subarray(0, FILE_MAGIC.length).equals(FILE_MAGIC)) return data;

    const iv = file.subarray(FILE_MAGIC.length, FILE_MAGIC.length + IV_BYTES);
    const decipher = createDecipheriv(ALGORITHM, FILE_KEY, iv);

    decipher.setAuthTag(
        file.subarray(FILE_MAGIC.length + IV_BYTES, FILE_HEADER_BYTES),
    );

    return Buffer.concat([
        decipher.update(file.subarray(FILE_HEADER_BYTES)),
        decipher.final(),
    ]);
}
