export const searchableValues = (original: unknown): (string | number)[] => {
    if (!original || typeof original !== 'object') return [];

    return Object.values(original).filter(
        (value): value is string | number =>
            typeof value === 'string' || typeof value === 'number',
    );
};
