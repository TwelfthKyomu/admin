import 'server-only';

import { cache } from 'react';
import { STALE_SESSION_ROUTE } from '@/shared/constants/auth';
import { findOrganizationByUserId } from '@/contexts/organization/Organization.lib';
import type { UserOrganizationView } from '@/contexts/organization/Organizations.table';
import type { User } from '@/types/better-auth';
import { redirect } from 'next/navigation';
import { getServerSession } from './getServerSession';

export interface Context {
    user: User;
    organization: UserOrganizationView;
}

export const requireContext = cache(async (): Promise<Context> => {
    const session = await getServerSession();

    if (!session?.user) redirect(STALE_SESSION_ROUTE);

    const organization = await findOrganizationByUserId(session.user.id);

    if (!organization) redirect('/onboarding');

    return { user: session.user, organization };
});
