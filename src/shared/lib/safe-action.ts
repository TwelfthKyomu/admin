import {
    AUTH_REQUIRED_MESSAGE,
    staleSessionRoute,
} from '@/shared/constants/auth';

export interface ActionResponse<TData = unknown> {
    data?: TData;
    serverError?: string;
    validationErrors?: unknown;
}

const FORM_VALIDATION_FAILED_MESSAGE = 'Проверьте поля формы';

function redirectToLogin(): void {
    if (typeof window === 'undefined') return;

    const { pathname, search } = window.location;

    window.location.assign(staleSessionRoute(pathname + search));
}

export function extractActionError(response: unknown): string | undefined {
    if (typeof response !== 'object' || response === null) return undefined;

    const { serverError, validationErrors } = response as ActionResponse;

    if (serverError === AUTH_REQUIRED_MESSAGE) redirectToLogin();
    if (serverError) return serverError;
    if (validationErrors) return FORM_VALIDATION_FAILED_MESSAGE;

    return undefined;
}
