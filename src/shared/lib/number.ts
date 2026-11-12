export const positiveInt = (
    value: string | null,
    max: number,
): number | undefined => {
    const parsed = value ? Number(value) : Number.NaN;

    return Number.isInteger(parsed) && parsed > 0
        ? Math.min(parsed, max)
        : undefined;
};
