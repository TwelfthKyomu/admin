export interface ActionResponse<TData = unknown> {
    data?: TData;
    serverError?: string;
    validationErrors?: unknown;
}

const FORM_VALIDATION_FAILED_MESSAGE = 'Проверьте поля формы';

export function extractActionError(response: unknown): string | undefined {
    if (typeof response !== 'object' || response === null) return undefined;

    const { serverError, validationErrors } = response as ActionResponse;

    if (serverError) return serverError;
    if (validationErrors) return FORM_VALIDATION_FAILED_MESSAGE;

    return undefined;
}
