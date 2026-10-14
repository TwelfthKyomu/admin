export function enumValues<T extends Record<string, string>>(
    source: T,
): [T[keyof T], ...T[keyof T][]] {
    return Object.values(source) as [T[keyof T], ...T[keyof T][]];
}
