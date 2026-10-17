type CsvCell = string | number | null | undefined;

const DELIMITER = ';';

function escapeCell(cell: CsvCell): string {
    const text = cell === null || cell === undefined ? '' : String(cell);

    return /[";\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function csvAmount(minorUnits: number): string {
    return (minorUnits / 100).toFixed(2).replace('.', ',');
}

export function downloadCsv(
    filename: string,
    header: string[],
    rows: CsvCell[][],
): void {
    const lines = [header, ...rows].map((row) =>
        row.map(escapeCell).join(DELIMITER),
    );

    const blob = new Blob([`\uFEFF${lines.join('\r\n')}`], {
        type: 'text/csv;charset=utf-8',
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
}
