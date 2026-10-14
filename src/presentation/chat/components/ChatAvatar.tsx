import { getInitials } from '@/shared/format/name';
import { cn } from '@/shared/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/Base';
import { avatarTone } from '../lib/avatar';

type ChatAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const SIZE_CLASS: Record<ChatAvatarSize, string> = {
    xs: 'size-6 rounded-md after:rounded-md text-[9.5px]',
    sm: 'size-7 rounded-lg after:rounded-lg text-[10.5px]',
    md: 'size-8 rounded-lg after:rounded-lg text-[12px]',
    lg: 'size-[34px] rounded-lg after:rounded-lg text-[12px]',
    xl: 'size-[52px] rounded-xl after:rounded-xl text-[18px]',
};

interface ChatAvatarProps {
    name: string;
    image?: string;
    seed?: string;
    initials?: string;
    size?: ChatAvatarSize;
    className?: string;
}

export const ChatAvatar = ({
    name,
    image,
    seed,
    initials,
    size = 'lg',
    className,
}: ChatAvatarProps) => (
    <Avatar className={cn(SIZE_CLASS[size], 'after:border-transparent', className)}>
        {image && (
            <AvatarImage
                src={image}
                alt={name}
                className="rounded-[inherit]"
            />
        )}
        <AvatarFallback
            className={cn(
                'rounded-[inherit] text-[length:inherit] font-semibold',
                seed ? cn(avatarTone(seed), 'text-white') : 'bg-muted text-foreground',
            )}
        >
            {initials ?? getInitials(name)}
        </AvatarFallback>
    </Avatar>
);
