import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@/ui/Base';
import { X } from 'lucide-react';
import Image from 'next/image';

interface ImageThumbProps {
    src: string;
    onRemove: () => void;
}

export const ImageThumb = ({ src, onRemove }: ImageThumbProps) => (
    <Tooltip>
        <TooltipTrigger asChild>
            <div className="group relative size-10 shrink-0 overflow-hidden rounded-md border border-border">
                <Image
                    src={src}
                    alt=""
                    fill
                    sizes="40px"
                    unoptimized
                    className="object-cover"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Удалить картинку"
                    onClick={onRemove}
                    className="absolute top-0 right-0 size-5 rounded-bl bg-background/80 opacity-0 transition group-hover:opacity-100"
                >
                    <X className="size-3" />
                </Button>
            </div>
        </TooltipTrigger>
        <TooltipContent className="p-1">
            <Image
                src={src}
                alt=""
                width={192}
                height={192}
                unoptimized
                className="max-h-48 max-w-48 rounded object-contain"
            />
        </TooltipContent>
    </Tooltip>
);
