import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { Button } from '../../../Button';

interface TableErrorProps {
    message: ReactNode;
    onRetry?: () => void;
    className?: string;
}

export const TableError = ({ message, onRetry, className }: TableErrorProps) => (
    <div
        className={cn(
            'flex flex-col items-center justify-center gap-3 rounded-md border px-6 py-12 text-center',
            className,
        )}
    >
        <div className="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <TriangleAlert className="size-5" />
        </div>
        <p className="font-medium text-sm">{message}</p>
        {onRetry && (
            <Button
                onClick={onRetry}
                variant="outline"
                size="sm"
            >
                <RotateCcw className="size-4" />
                Повторить
            </Button>
        )}
    </div>
);
