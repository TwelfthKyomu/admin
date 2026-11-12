'use client';

import { useStaticData } from '@/app/providers';
import { ROUTES } from '@/shared/constants';
import { signOut } from '@/shared/lib/auth-client';
import { useRouter } from 'next/navigation';
import { useSidebar } from '../../primitives/Sidebar';

export const useNavUser = () => {
    const { isMobile } = useSidebar();
    const router = useRouter();
    const { user, organization } = useStaticData();

    const handleSignOut = async () => {
        await signOut();
        router.push(ROUTES.auth);
        router.refresh();
    };

    return { isMobile, user, organization, handleSignOut };
};
