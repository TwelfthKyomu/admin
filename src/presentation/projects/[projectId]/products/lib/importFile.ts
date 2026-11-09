import { downloadCsv } from '@/shared/lib/csv';
import {
    type ParsedImportRow,
    PRODUCT_IMPORT_HEADER,
    parseImportRecord,
} from '@/contexts/product';
import { parse } from 'papaparse';

function decode(buffer: ArrayBuffer): string {
    try {
        return new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    } catch {
        return new TextDecoder('windows-1251').decode(buffer);
    }
}

export async function readImportFile(file: File): Promise<ParsedImportRow[]> {
    const { data } = parse<Record<string, string>>(
        decode(await file.arrayBuffer()),
        {
            header: true,
            skipEmptyLines: 'greedy',
        },
    );

    return data.map((record, index) => parseImportRecord(record, index + 2));
}

export function downloadImportTemplate(): void {
    downloadCsv('products-import.csv', PRODUCT_IMPORT_HEADER, [
        [
            'Футболка оверсайз',
            'TS-001',
            '1990',
            '800',
            '4600000000001',
            'Футболки',
            '10',
            'Хлопок 100%',
        ],
    ]);
}
