import {
    CircleCheckIcon,
    InfoIcon,
    type LucideIcon,
    OctagonXIcon,
} from 'lucide-react';

export type ToastTone = 'success' | 'error' | 'info';

interface ToastToneStyle {
    icon: LucideIcon;
    badge: string;
    bar: string;
}

export const TOAST_TONE: Record<ToastTone, ToastToneStyle> = {
    success: {
        icon: CircleCheckIcon,
        badge: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
        bar: 'bg-emerald-500',
    },
    error: {
        icon: OctagonXIcon,
        badge: 'bg-destructive/15 text-destructive',
        bar: 'bg-destructive',
    },
    info: {
        icon: InfoIcon,
        badge: 'bg-primary/10 text-primary',
        bar: 'bg-primary',
    },
};
