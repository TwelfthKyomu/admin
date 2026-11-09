import {
    BARCODE_MAX,
    BARCODE_MIN,
    LABEL_MAX,
    SKU_MAX,
    SKU_MIN,
} from '@/shared/constants/default';
import {
    BARCODE_PATTERN,
    UPPER_CODE_PATTERN,
} from '@/shared/validation/fields';

export const PRODUCT_IMPORT_ROWS_MAX = 1000;

export interface ProductImportRow {
    name: string;
    sku: string;
    price: number;
    costAmount: number | null;
    barcode: string | null;
    category: string | null;
    stock: number | null;
    description: string | null;
}

const IMPORT_COLUMNS: Record<keyof ProductImportRow, readonly string[]> = {
    name: ['название', 'наименование', 'товар', 'name'],
    sku: ['артикул', 'sku'],
    price: ['цена', 'price'],
    costAmount: ['закупочная цена', 'себестоимость', 'закупка', 'cost'],
    barcode: ['штрихкод', 'barcode', 'ean'],
    category: ['категория', 'category'],
    stock: ['остаток', 'количество', 'stock'],
    description: ['описание', 'description'],
};

export const PRODUCT_IMPORT_HEADER = [
    'Название',
    'Артикул',
    'Цена',
    'Закупочная цена',
    'Штрихкод',
    'Категория',
    'Остаток',
    'Описание',
];

export interface ProductImportResult {
    created: number;
    updated: number;
    failed: { sku: string; message: string }[];
}

export interface ParsedImportRow {
    line: number;
    row?: ProductImportRow;
    error?: string;
}

function fieldOf(header: string): string | undefined {
    const normalized = header.trim().toLowerCase();

    return Object.entries(IMPORT_COLUMNS).find(([, aliases]) =>
        aliases.includes(normalized),
    )?.[0];
}

export function parseAmount(text: string): number | null | undefined {
    const normalized = text.replace(/[\s ₽]/g, '').replace(',', '.');

    if (!normalized) return null;

    const value = Number(normalized);

    return Number.isFinite(value) && value >= 0
        ? Math.round(value * 100)
        : undefined;
}

export function parseQuantity(text: string): number | null | undefined {
    const normalized = text.replace(/\s/g, '');

    if (!normalized) return null;

    const value = Number(normalized);

    return Number.isInteger(value) && value >= 0 ? value : undefined;
}

function textOrNull(value: string | undefined): string | null {
    return value?.trim() || null;
}

function codeError(values: Record<string, string>): string | undefined {
    const sku = values.sku?.trim().toUpperCase() ?? '';
    const barcode = values.barcode?.trim() ?? '';

    if (!sku) return 'Нет артикула';
    if (
        sku.length < SKU_MIN ||
        sku.length > SKU_MAX ||
        !UPPER_CODE_PATTERN.test(sku)
    ) {
        return 'Артикул — латинские буквы, цифры и дефис';
    }
    if (
        barcode &&
        (barcode.length < BARCODE_MIN ||
            barcode.length > BARCODE_MAX ||
            !BARCODE_PATTERN.test(barcode))
    ) {
        return 'Штрихкод — цифры и латинские буквы';
    }

    return undefined;
}

function rowError(values: Record<string, string>): string | undefined {
    const name = values.name?.trim() ?? '';

    if (!name) return 'Нет названия';
    if (name.length > LABEL_MAX)
        return `Название длиннее ${LABEL_MAX} символов`;

    const code = codeError(values);

    if (code) return code;
    if (!parseAmount(values.price ?? '')) return 'Цена — число больше нуля';
    if (parseAmount(values.costAmount ?? '') === undefined) {
        return 'Закупочная цена — число';
    }
    if (parseQuantity(values.stock ?? '') === undefined) {
        return 'Остаток — целое число не меньше нуля';
    }

    return undefined;
}

export function parseImportRecord(
    record: Record<string, string>,
    line: number,
): ParsedImportRow {
    const values: Record<string, string> = {};

    for (const [header, value] of Object.entries(record)) {
        const field = fieldOf(header);

        if (field) values[field] = value;
    }

    const error = rowError(values);

    if (error) return { line, error };

    return {
        line,
        row: {
            name: values.name?.trim() ?? '',
            sku: values.sku?.trim().toUpperCase() ?? '',
            price: parseAmount(values.price ?? '') ?? 0,
            costAmount: parseAmount(values.costAmount ?? '') ?? null,
            barcode: textOrNull(values.barcode),
            category: textOrNull(values.category),
            stock: parseQuantity(values.stock ?? '') ?? null,
            description: textOrNull(values.description),
        },
    };
}
