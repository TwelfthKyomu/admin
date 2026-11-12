import { createElement } from 'react';
import { AppToast } from '@/ui/Base/Sonner/AppToast';
import type { ToastTone } from '@/ui/Base/Sonner/lib/toastTone';
import { toast as sonner } from 'sonner';

const TOAST_DURATION_MS = 4000;

const show = (tone: ToastTone) => (title: string, description?: string) =>
    sonner.custom(
        (id) =>
            createElement(AppToast, {
                id,
                tone,
                title,
                description,
                duration: TOAST_DURATION_MS,
            }),
        { duration: TOAST_DURATION_MS },
    );

export const toast = {
    success: show('success'),
    error: show('error'),
    info: show('info'),
};
