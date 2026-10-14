function hasMessage(value: unknown): value is { message: unknown } {
    return typeof value === 'object' && value !== null && 'message' in value;
}

export function getErrorMessage(value: unknown): string {
    if (typeof value === 'string') return value;
    if (hasMessage(value) && typeof value.message === 'string')
        return value.message;

    return 'Unknown error';
}
