export const NONE = 'none';

export const fromNone = (value: string | null | undefined): string | null => {
    return value && value !== NONE ? value : null;
};
