export const isValidDate = (value?: Date): value is Date => {
    return value instanceof Date && !Number.isNaN(value.getTime());
};

export const formatDate = (date: Date, locale: string): string => {
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
};
