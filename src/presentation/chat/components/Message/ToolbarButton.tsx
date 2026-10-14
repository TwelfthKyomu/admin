import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/ui/Base';

interface ToolbarButtonProps {
    label: string;
    onClick: () => void;
    destructive?: boolean;
    children: ReactNode;
}

export const ToolbarButton = ({
    label,
    onClick,
    destructive = false,
    children,
}: ToolbarButtonProps) => (
    <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        onClick={onClick}
        aria-label={label}
        title={label}
        className={cn(
            '[&_svg]:size-3.5',
            destructive && 'text-destructive hover:bg-destructive/18 hover:text-destructive',
        )}
    >
        {children}
    </Button>
);
