import type { ReactNode } from 'react';
import { UserAvatar } from '../UserAvatar';

interface PersonCellProps {
    name: string;
    image?: string;
    caption?: ReactNode;
}

export const PersonCell = ({ name, image, caption }: PersonCellProps) => (
    <div className="flex min-w-0 items-center gap-2.5">
        <UserAvatar
            name={name}
            image={image}
            className="shrink-0"
        />
        <div className="grid min-w-0 gap-0.5">
            <span className="truncate text-[13px] font-medium">{name}</span>
            {caption && (
                <span className="truncate text-[12px] text-muted-foreground">{caption}</span>
            )}
        </div>
    </div>
);
