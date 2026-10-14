import type { ChatAttachmentView, ChatTarget } from '@/contexts/chat';
import {
    File,
    FileArchive,
    FileImage,
    FileSpreadsheet,
    FileText,
    Presentation,
} from 'lucide-react';

export const CHAT_FILE_ACCEPT =
    '.jpg,.jpeg,.png,.gif,.webp,.pdf,.doc,.docx,.xls,.xlsx,.pptx,.zip,.txt,.csv';

export async function uploadChatFile(
    target: ChatTarget,
    file: globalThis.File,
): Promise<ChatAttachmentView> {
    const form = new FormData();

    form.set('file', file);
    form.set('target', JSON.stringify(target));

    const response = await fetch('/api/chat/uploads', {
        method: 'POST',
        body: form,
    });

    const payload = (await response.json().catch(() => undefined)) as
        | (ChatAttachmentView & { error?: undefined })
        | { error: string }
        | undefined;

    if (!response.ok || !payload || payload.error !== undefined) {
        throw new Error(payload?.error ?? 'Не удалось загрузить файл');
    }

    return payload;
}

export function attachmentIcon(contentType: string) {
    if (contentType.startsWith('image/')) return FileImage;

    if (
        contentType.includes('spreadsheet') ||
        contentType.includes('excel') ||
        contentType.startsWith('text/csv')
    ) {
        return FileSpreadsheet;
    }

    if (contentType.includes('presentation')) return Presentation;
    if (contentType === 'application/zip') return FileArchive;

    if (
        contentType === 'application/pdf' ||
        contentType.includes('word') ||
        contentType.startsWith('text/')
    ) {
        return FileText;
    }

    return File;
}
