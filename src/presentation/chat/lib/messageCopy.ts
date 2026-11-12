import { copyToClipboard } from '@/shared/lib/clipboard';

export const copyMessage = (body: string) =>
    copyToClipboard(body, 'Сообщение скопировано');
