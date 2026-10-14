import { cn } from '@/shared/lib/utils';
import { INBOX_FOLDER_OPTIONS, type InboxFolder } from '../../lib/inbox';

interface InboxFoldersProps {
    value: InboxFolder;
    counts: Record<InboxFolder, number>;
    onChange: (folder: InboxFolder) => void;
}

export const InboxFolders = ({ value, counts, onChange }: InboxFoldersProps) => (
    <div className="flex flex-wrap gap-1.5">
        {INBOX_FOLDER_OPTIONS.map((folder) => (
            <button
                key={folder.value}
                type="button"
                onClick={() => onChange(folder.value)}
                aria-pressed={value === folder.value}
                className={cn(
                    'inline-flex h-[26px] items-center gap-[5px] rounded-full border px-[9px] text-[12px] leading-none font-medium transition-colors',
                    value === folder.value
                        ? 'border-transparent bg-primary text-primary-foreground'
                        : 'border-border bg-foreground/[0.04] text-muted-foreground hover:text-foreground',
                )}
            >
                <span>{folder.label}</span>
                <span className="font-mono opacity-65">{counts[folder.value]}</span>
            </button>
        ))}
    </div>
);
