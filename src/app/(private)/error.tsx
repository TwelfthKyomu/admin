'use client';

import { ErrorState } from '@/shared/components/common';

interface PrivateErrorProps {
    reset: () => void;
}

const PrivateError = ({ reset }: PrivateErrorProps) => (
    <ErrorState
        title="Что-то пошло не так"
        description="Не удалось загрузить раздел. Попробуйте ещё раз или перейдите в другой раздел через навигацию слева."
        onRetry={reset}
        className="min-h-[60vh]"
    />
);

export default PrivateError;
