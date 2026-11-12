'use client';

import { ROUTES } from '@/shared/constants';
import { signOut } from '@/shared/lib/auth-client';
import { useRouter } from 'next/navigation';

export const useSwitchAccount = (token: string) => {
    const { push } = useRouter();

    return async () => {
        await signOut();

        push(
            `${ROUTES.auth}?callbackUrl=${encodeURIComponent(ROUTES.invite(token))}`,
        );
    };
};
