'use client';

import { CALLBACK_URL_PARAM, safeCallbackPath } from '@/shared/constants/auth';
import { useSearchParams } from 'next/navigation';
import { LoginTabs } from './LoginTabs';

export const CallbackLoginTabs = () => {
    const searchParams = useSearchParams();

    return <LoginTabs redirectTo={safeCallbackPath(searchParams.get(CALLBACK_URL_PARAM))} />;
};
