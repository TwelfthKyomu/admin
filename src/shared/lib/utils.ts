export { cn } from 'cnfast';

export function mapDefined<T, R>(
    value: T | undefined,
    map: (value: T) => R,
): R | undefined {
    return value === undefined ? undefined : map(value);
}
