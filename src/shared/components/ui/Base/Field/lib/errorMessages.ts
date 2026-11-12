interface FieldErrorItem {
    message?: string;
}

export const uniqueErrorMessages = (
    errors?: Array<FieldErrorItem | undefined>,
): string[] => {
    const messages = (errors ?? []).flatMap((error) =>
        error?.message ? [error.message] : [],
    );

    return [...new Set(messages)];
};
