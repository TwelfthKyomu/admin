import { cn } from '@/shared/lib/utils';
import { ExternalLink } from 'lucide-react';

interface DetailRowProps {
    label: string;
    value: string;
    dim?: boolean;
    strong?: boolean;
    mono?: boolean;
    url?: string;
}

export const DetailRow = ({ label, value, dim, strong, mono, url }: DetailRowProps) => {
    const content = (
        <span
            className={cn(
                'tabular-nums',
                strong && 'font-semibold',
                dim && 'text-muted-foreground',
                mono && 'font-mono text-[12px]',
            )}
        >
            {value}
        </span>
    );

    return (
        <div className="flex items-center justify-between gap-3">
            <span className="text-muted-foreground">{label}</span>
            {url ? (
                <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 hover:underline"
                >
                    {content}
                    <ExternalLink className="size-3.5" />
                </a>
            ) : (
                content
            )}
        </div>
    );
};
