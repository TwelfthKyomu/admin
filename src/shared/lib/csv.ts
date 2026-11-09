import { unparse } from 'papaparse';

type CsvCell = string | number | null | undefined;

export function csvAmount(minorUnits: number): string {
    return (minorUnits / 100).toFixed(2).replace('.', ',');
}

export function downloadCsv(
    filename: string,
    header: string[],
    rows: CsvCell[][],
): void {
    const text = unparse(
        { fields: header, data: rows },
        { delimiter: ';', newline: '\r\n' },
    );

    const blob = new Blob([`\uFEFF${text}`], {
        type: 'text/csv;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
