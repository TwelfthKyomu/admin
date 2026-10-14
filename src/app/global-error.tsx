'use client';

import { ErrorState } from '@/shared/components/common';

interface GlobalErrorProps {
    reset: () => void;
}

const GlobalError = ({ reset }: GlobalErrorProps) => (
    <html lang="ru">
        <body>
            <ErrorState
                title="Что-то пошло не так"
                onRetry={reset}
                className="min-h-[60vh]"
            />
        </body>
    </html>
);

export default GlobalError;
