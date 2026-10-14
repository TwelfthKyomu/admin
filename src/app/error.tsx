'use client';

import { ErrorState } from '@/shared/components/common';

interface AppErrorProps {
    reset: () => void;
}

const AppError = ({ reset }: AppErrorProps) => (
    <ErrorState
        title="Что-то пошло не так"
        onRetry={reset}
        className="min-h-[60vh]"
    />
);

export default AppError;
