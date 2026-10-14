import type { CardMediaItem } from '../../hooks/useChatCard';
import { CardEmpty } from './Empty';

interface CardMediaProps {
    items: CardMediaItem[];
    onBroken: (url: string) => void;
}

export const CardMedia = ({ items, onBroken }: CardMediaProps) => {
    if (items.length === 0) return <CardEmpty text="Изображений в переписке пока нет." />;

    return (
        <div className="grid grid-cols-3 gap-1.5">
            {items.map((item) => (
                <a
                    key={item.key}
                    href={item.url}
                    target="_blank"
                    rel={item.external ? 'noreferrer noopener' : 'noopener'}
                    className="aspect-square overflow-hidden rounded-lg bg-muted"
                >
                    {/* biome-ignore lint/performance/noImgElement: адреса приходят из переписки и /files, next/image их не пропустит */}
                    <img
                        src={item.url}
                        alt={item.alt}
                        loading="lazy"
                        referrerPolicy={item.external ? 'no-referrer' : undefined}
                        onError={item.external ? () => onBroken(item.url) : undefined}
                        className="size-full object-cover"
                    />
                </a>
            ))}
        </div>
    );
};
