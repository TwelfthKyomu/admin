import type { ComponentProps } from 'react';
import { getInitials } from '@/shared/format/name';
import { Avatar, AvatarFallback, AvatarImage } from '@/ui/Base';

interface UserAvatarProps extends Pick<ComponentProps<typeof Avatar>, 'size' | 'className'> {
    name: string;
    image?: string;
}

export const UserAvatar = ({ name, image, size, className }: UserAvatarProps) => (
    <Avatar
        size={size}
        className={className}
    >
        {image && (
            <AvatarImage
                src={image}
                alt={name}
            />
        )}
        <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
);
