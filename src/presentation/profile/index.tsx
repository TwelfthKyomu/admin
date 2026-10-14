'use client';

import { AccountCard } from './components/AccountCard';
import { PasswordCard } from './components/PasswordCard';
import { SessionsCard } from './components/Sessions';

export const ProfilePage = () => (
    <div className="grid max-w-3xl gap-5">
        <AccountCard />
        <PasswordCard />
        <SessionsCard />
    </div>
);
