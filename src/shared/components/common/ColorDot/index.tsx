import { cn } from '@/shared/lib/utils';

interface ColorDotProps {
    color?: string;
    className?: string;
}

export const ColorDot = ({ color, className }: ColorDotProps) => (
    <span
        aria-hidden
        className={cn('size-2.5 shrink-0 rounded-full', className)}
        style={{ backgroundColor: color ?? '#737373' }}
    />
);
