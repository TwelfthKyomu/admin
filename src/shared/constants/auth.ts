export const AUTH_ROUTE = '/auth';

export const STALE_SESSION_PARAM = 'session';
export const STALE_SESSION_VALUE = 'stale';

export const STALE_SESSION_ROUTE = `${AUTH_ROUTE}?${STALE_SESSION_PARAM}=${STALE_SESSION_VALUE}`;

export const AUTH_COOKIE_PREFIX = 'better-auth.';

export const AUTH_REQUIRED_MESSAGE = 'Требуется авторизация';

export const CALLBACK_URL_PARAM = 'callbackUrl';

export function safeCallbackPath(value: string | null | undefined): string {
    return value?.startsWith('/') && !/^\/[/\\]/.test(value) ? value : '/';
}

export function staleSessionRoute(callbackPath: string): string {
    const params = new URLSearchParams({
        [STALE_SESSION_PARAM]: STALE_SESSION_VALUE,
        [CALLBACK_URL_PARAM]: safeCallbackPath(callbackPath),
    });

    return `${AUTH_ROUTE}?${params}`;
}
