const UNITS = ['Б', 'КБ', 'МБ', 'ГБ'] as const;

export function fmtBytes(bytes: number): string {
    let value = bytes;
    let unit = 0;

    while (value >= 1024 && unit < UNITS.length - 1) {
        value /= 1024;
        unit += 1;
    }

    const digits = unit === 0 || value >= 10 ? 0 : 1;

    return `${value.toLocaleString('ru-RU', { maximumFractionDigits: digits })} ${UNITS[unit]}`;
}
