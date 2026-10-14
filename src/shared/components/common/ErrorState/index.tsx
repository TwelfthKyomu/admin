'use client';

import type { ReactNode } from 'react';
import { Button } from '@/ui/Base';
import { RotateCcw, TriangleAlert } from 'lucide-react';
import { EmptyState } from '../EmptyState';

interface ErrorStateProps {
    title?: string;
    description?: ReactNode;
    onRetry?: () => void;
    className?: string;
}

export const ErrorState = ({
    title = 'Не удалось загрузить данные',
    description = 'Проверьте соединение и попробуйте ещё раз.',
    onRetry,
    className,
}: ErrorStateProps) => (
    <EmptyState
        destructive
        icon={TriangleAlert}
        title={title}
        description={description}
        className={className}
        action={
            onRetry && (
                <Button
                    onClick={onRetry}
                    variant="outline"
                    size="sm"
                >
                    <RotateCcw className="size-4" />
                    Повторить
                </Button>
            )
        }
    />
);
