import { describe, expect, it } from 'vitest';
import { detectFileType, detectImageType } from './fileType';

const PNG = Buffer.concat([
    Buffer.from('89504e470d0a1a0a0000000d49484452', 'hex'),
    Buffer.alloc(20),
]);

const PDF = new TextEncoder().encode('%PDF-1.7\n1 0 obj\n');

const CFB = Buffer.concat([
    Buffer.from('d0cf11e0a1b11ae1', 'hex'),
    Buffer.alloc(504),
]);

const TEXT = new TextEncoder().encode('артикул;цена\nhoodie;6500\n');

describe('detectFileType', () => {
    it('узнаёт картинку по содержимому, а не по имени', async () => {
        expect(await detectFileType(PNG, 'photo.pdf')).toEqual({
            ext: 'png',
            contentType: 'image/png',
            isImage: true,
        });
    });

    it('пропускает PDF', async () => {
        expect((await detectFileType(PDF, 'doc.pdf'))?.contentType).toBe(
            'application/pdf',
        );
    });

    it('старый doc/xls принимает только с подходящим расширением', async () => {
        expect((await detectFileType(CFB, 'report.xls'))?.contentType).toBe(
            'application/vnd.ms-excel',
        );

        expect(await detectFileType(CFB, 'report.exe')).toBeNull();
    });

    it('текст принимает как csv/txt только если это UTF-8', async () => {
        expect((await detectFileType(TEXT, 'price.csv'))?.ext).toBe('csv');

        expect(
            await detectFileType(Uint8Array.from([0xff, 0, 1]), 'a.txt'),
        ).toBeNull();
    });
});

describe('detectImageType', () => {
    it('отклоняет всё, кроме картинок', async () => {
        expect(await detectImageType(PDF)).toBeNull();
        expect((await detectImageType(PNG))?.isImage).toBe(true);
    });
});
