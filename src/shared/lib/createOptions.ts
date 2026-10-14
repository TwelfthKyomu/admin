import type { Option } from '@/shared/types';

export function createOptions<T extends string | number | symbol>(
    values: T[],
    labels: Record<T, string>,
): ReadonlyArray<Option<T>> {
    return values.map((value) => ({
        value,
        label: labels[value],
    }));
}
