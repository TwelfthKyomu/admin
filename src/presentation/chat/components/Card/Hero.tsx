import type { ReactNode } from 'react';
import { ChatAvatar } from '../ChatAvatar';

interface CardHeroProps {
    name: string;
    caption: string;
    image?: string;
    seed?: string;
    initials?: string;
    action?: ReactNode;
}

export const CardHero = ({ name, caption, image, seed, initials, action }: CardHeroProps) => (
    <div className="flex flex-col items-center gap-2 rounded-[14px] bg-card p-4 text-center outline outline-border">
        <ChatAvatar
            size="xl"
            name={name}
            image={image}
            seed={seed}
            initials={initials}
        />
        <div className="text-[14.5px] leading-[1.25] font-semibold">{name}</div>
        <div className="text-[12px] leading-[1.3] text-muted-foreground">{caption}</div>
        {action}
    </div>
);
