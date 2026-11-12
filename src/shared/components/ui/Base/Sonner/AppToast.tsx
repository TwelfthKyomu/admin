'use client';

import { cn } from '@/shared/lib/utils';
import { XIcon } from 'lucide-react';
import { toast as sonner } from 'sonner';
import { useToastProgress } from './hooks/useToastProgress';
import { TOAST_TONE, type ToastTone } from './lib/toastTone';

interface AppToastProps {
    id: string | number;
    tone: ToastTone;
    title: string;
    description?: string;
    duration: number;
}

export const AppToast = ({ id, tone, title, description, duration }: AppToastProps) => {
    const { icon: Icon, badge, bar } = TOAST_TONE[tone];
    const { barRef, pause, resume } = useToastProgress(duration);

    return (
        <div
            role="status"
            aria-live={tone === 'error' ? 'assertive' : 'polite'}
            className="relative flex w-[356px] max-w-[calc(100vw-2rem)] items-start gap-3 overflow-hidden rounded-xl border bg-popover p-3 pr-10 text-popover-foreground shadow-lg"
            onMouseEnter={pause}
            onMouseLeave={resume}
        >
            <span
                className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-full',
                    badge,
                )}
            >
                <Icon className="size-4" />
            </span>
            <div className="grid min-w-0 gap-0.5 pt-1.5">
                <p className="font-medium text-[13px] leading-tight">{title}</p>
                {description && <p className="text-[12px] text-muted-foreground">{description}</p>}
            </div>
            <button
                type="button"
                aria-label="Закрыть"
                className="absolute top-2 right-2 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                onClick={() => sonner.dismiss(id)}
            >
                <XIcon className="size-3.5" />
            </button>
            <span
                ref={barRef}
                className={cn('absolute bottom-0 left-0 h-0.5 w-full origin-left', bar)}
            />
        </div>
    );
};
