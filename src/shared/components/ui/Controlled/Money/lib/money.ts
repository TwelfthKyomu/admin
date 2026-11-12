export const MONEY_PATTERN = /^\d*([.,]\d{0,2})?$/;

export const minorToText = (minor: number | null | undefined): string => {
    return minor == null ? '' : (minor / 100).toFixed(2);
};

export const textToMinor = (raw: string): number | null => {
    const normalized = raw.trim().replace(/,/g, '.');

    if (normalized === '') return null;

    const major = Number(normalized);

    return Number.isNaN(major) ? null : Math.round(major * 100);
};
