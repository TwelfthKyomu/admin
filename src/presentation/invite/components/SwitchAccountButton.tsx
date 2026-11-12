'use client';

import { Button } from '@/ui/Base';
import { useSwitchAccount } from '../hooks/useSwitchAccount';

export const SwitchAccountButton = ({ token }: { token: string }) => {
    const switchAccount = useSwitchAccount(token);

    return (
        <Button
            className="w-full"
            variant="outline"
            onClick={switchAccount}
        >
            Выйти и сменить аккаунт
        </Button>
    );
};
