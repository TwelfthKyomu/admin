import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/ui/Base';
import { X } from 'lucide-react';

interface ComposerBannerProps {
    icon?: ReactNode;
    title: string;
    text: string;
    tone: 'reply' | 'edit';
    cancelLabel: string;
    onCancel: () => void;
}

export const ComposerBanner = ({
    icon,
    title,
    text,
    tone,
    cancelLabel,
    onCancel,
}: ComposerBannerProps) => (
    <div className="mb-2 flex items-start gap-[9px] rounded-lg border-l-2 border-violet-500 bg-muted/40 px-2.5 py-2">
        {icon}
        <div className="min-w-0 flex-1">
            <div
                className={cn(
                    'text-[11px] leading-[1.3] font-medium',
                    tone === 'edit' ? 'text-violet-300' : 'text-violet-400',
                )}
            >
                {title}
            </div>
            <div className="truncate text-[12px] leading-[1.4] text-muted-foreground">{text}</div>
        </div>
        <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="size-[22px] shrink-0 text-muted-foreground"
            onClick={onCancel}
            aria-label={cancelLabel}
        >
            <X className="size-[13px]" />
        </Button>
    </div>
);
