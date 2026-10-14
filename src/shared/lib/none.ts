export const NONE = 'none';

export function fromNone(value: string | null | undefined): string | null {
    return value && value !== NONE ? value : null;
}
