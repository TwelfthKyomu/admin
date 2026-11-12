import { describe, expect, it } from 'vitest';
import { isPublicHttpUrl } from './public-url';

describe('isPublicHttpUrl', () => {
    it.each([
        'https://8.8.8.8/',
        'https://172.67.198.182/',
        'http://[2606:4700::1]/',
        'http://[::ffff:8.8.8.8]/',
    ])('пропускает публичный адрес %s', async (url) => {
        expect(await isPublicHttpUrl(url)).toBe(true);
    });

    it.each([
        'http://127.0.0.1/',
        'http://10.1.2.3/',
        'http://172.16.0.5/',
        'http://192.168.1.1/',
        'http://169.254.169.254/',
        'http://100.64.0.1/',
        'http://0.0.0.0/',
        'http://[::1]/',
        'http://[::ffff:127.0.0.1]/',
        'http://[::ffff:10.0.0.1]/',
        'http://[fd00::1]/',
        'http://[fe80::1]/',
    ])('отклоняет внутренний адрес %s', async (url) => {
        expect(await isPublicHttpUrl(url)).toBe(false);
    });

    it.each(['ftp://8.8.8.8/', 'not a url'])(
        'отклоняет не-http адрес %s',
        async (url) => {
            expect(await isPublicHttpUrl(url)).toBe(false);
        },
    );
});
