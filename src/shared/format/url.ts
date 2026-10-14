import { SLUG_MAX } from '@/shared/constants/default';
import slugifyText from 'slugify';

export function slugify(input: string, maxLength = SLUG_MAX): string {
    return slugifyText(input, {
        lower: true,
        strict: true,
        locale: 'ru',
    }).slice(0, maxLength);
}

function normalizePath(path: string): string {
    return (
        (path.startsWith('/') ? path : `/${path}`).replace(/\/+$/, '') || '/'
    );
}

export function isActiveUrl(
    pathname: string,
    href: string,
    exact = false,
): boolean {
    const current = normalizePath(pathname);
    const target = normalizePath(href);

    if (exact || target === '/') return current === target;

    return current === target || current.startsWith(`${target}/`);
}

export function absoluteUrl(path: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    return `${origin}${path}`;
}
