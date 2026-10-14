interface UploadResponse {
    url?: string;
    error?: string;
}

export async function uploadImage(
    projectId: string,
    file: File,
): Promise<string> {
    const body = new FormData();

    body.append('projectId', projectId);
    body.append('file', file);

    const response = await fetch('/api/admin/uploads', {
        method: 'POST',
        body,
    });

    const json: UploadResponse = await response.json().catch(() => ({}));

    if (!response.ok || !json.url) {
        throw new Error(json.error ?? `Не удалось загрузить «${file.name}»`);
    }

    return json.url;
}
