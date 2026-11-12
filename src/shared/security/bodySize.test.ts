import { describe, expect, it } from 'vitest';
import { isBodyTooLarge } from './bodySize';

const request = (length?: number) => {
    return new Request('http://localhost/upload', {
        method: 'POST',
        headers:
            length === undefined ? {} : { 'content-length': String(length) },
    });
};

describe('isBodyTooLarge', () => {
    it('пропускает файл в пределах лимита с запасом на multipart', () => {
        expect(isBodyTooLarge(request(1024 * 1024 + 1000), 1024 * 1024)).toBe(
            false,
        );
    });

    it('отклоняет тело заметно больше лимита', () => {
        expect(isBodyTooLarge(request(2 * 1024 * 1024), 1024 * 1024)).toBe(
            true,
        );
    });

    it('без длины решает проверка файла после разбора', () => {
        expect(isBodyTooLarge(request(), 1024)).toBe(false);
    });
});
