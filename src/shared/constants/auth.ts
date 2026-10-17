export const AUTH_ROUTE = '/auth';

export const STALE_SESSION_PARAM = 'session';
export const STALE_SESSION_VALUE = 'stale';

export const STALE_SESSION_ROUTE = `${AUTH_ROUTE}?${STALE_SESSION_PARAM}=${STALE_SESSION_VALUE}`;

export const AUTH_COOKIE_PREFIX = 'better-auth.';

export const CALLBACK_URL_PARAM = 'callbackUrl';

export function safeCallbackPath(value: string | null | undefined): string {
    return value?.startsWith('/') && !/^\/[/\\]/.test(value) ? value : '/';
}
