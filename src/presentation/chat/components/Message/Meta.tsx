import { fmtTime } from '@/shared/format/date';
import { cn } from '@/shared/lib/utils';

interface MessageMetaProps {
    createdAt: Date;
    edited: boolean;
    status?: 'sent' | 'read';
}

export const MessageMeta = ({ createdAt, edited, status }: MessageMetaProps) => (
    <div className="mt-[5px] flex items-center justify-end gap-1.5 opacity-65">
        {edited && <span className="text-[10.5px] leading-none">изменено</span>}
        <span className="font-mono text-[10.5px] leading-none">{fmtTime(new Date(createdAt))}</span>
        {status && (
            <span
                className={cn(
                    'font-mono text-[11px] leading-none',
                    status === 'read' ? 'text-cyan-700' : 'text-neutral-600',
                )}
                title={status === 'read' ? 'Прочитано' : 'Отправлено'}
            >
                {status === 'read' ? '✓✓' : '✓'}
            </span>
        )}
    </div>
);
