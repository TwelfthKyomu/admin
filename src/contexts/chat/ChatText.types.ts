const URL_PATTERN = /https?:\/\/[^\s<>"']+/gi;

const TRAILING_PUNCTUATION = /[.,;:!?)\]}»"']+$/;

export type MessageTextPart =
    | { kind: 'text'; value: string }
    | { kind: 'link'; value: string };

export const splitMessageText = (text: string): MessageTextPart[] => {
    const parts: MessageTextPart[] = [];
    let cursor = 0;

    for (const match of text.matchAll(URL_PATTERN)) {
        const start = match.index;
        const url = match[0].replace(TRAILING_PUNCTUATION, '');

        if (start === undefined || url.length === 0) continue;

        if (start > cursor) {
            parts.push({ kind: 'text', value: text.slice(cursor, start) });
        }

        parts.push({ kind: 'link', value: url });
        cursor = start + url.length;
    }

    if (cursor < text.length) {
        parts.push({ kind: 'text', value: text.slice(cursor) });
    }

    return parts;
};

export const extractUrls = (text: string): string[] => {
    return splitMessageText(text)
        .filter((part) => part.kind === 'link')
        .map((part) => part.value);
};

const IMAGE_EXTENSIONS = [
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.webp',
    '.avif',
    '.bmp',
];

export const isImageUrl = (url: string): boolean => {
    const withoutQuery = url.split(/[?#]/)[0]?.toLowerCase() ?? '';

    return IMAGE_EXTENSIONS.some((extension) =>
        withoutQuery.endsWith(extension),
    );
};
