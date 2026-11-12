import { toast } from './toast';

export const copyToClipboard = async (
    text: string,
    success?: string,
): Promise<boolean> => {
    try {
        await navigator.clipboard.writeText(text);

        if (success) toast.success(success);

        return true;
    } catch {
        toast.error('Буфер обмена недоступен');

        return false;
    }
};
