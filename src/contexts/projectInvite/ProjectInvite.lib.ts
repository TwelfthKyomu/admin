import 'server-only';

import { getServerSession } from '@/infrastructure/auth/getServerSession';
import { db } from '@/infrastructure/database/client';
import { organizations } from '@/contexts/organization/Organizations.table';
import { organizationMembers } from '@/contexts/organizationMember/OrganizationMembers.table';
import { projects } from '@/contexts/project/Projects.table';
import { findActiveProjectMember } from '@/contexts/projectMember/ProjectMember.lib';
import { users } from '@/contexts/user/Users.table';
import { eq } from 'drizzle-orm';
import {
    type InviteStateView,
    type InviteView,
    inviteStatusAt,
    ProjectInviteStatus,
} from './ProjectInvite.types';
import { projectInvites } from './ProjectInvites.table';

export async function resolveInviteContext(
    token: string,
): Promise<InviteStateView> {
    const [row] = await db
        .select({
            invite: projectInvites,
            projectName: projects.name,
            organizationId: organizations.id,
            organizationName: organizations.name,
            inviterName: users.name,
            inviterEmail: users.email,
        })
        .from(projectInvites)
        .innerJoin(projects, eq(projects.id, projectInvites.projectId))
        .innerJoin(organizations, eq(organizations.id, projects.organizationId))
        .leftJoin(users, eq(users.id, projectInvites.createdBy))
        .where(eq(projectInvites.token, token))
        .limit(1);

    if (!row) return { state: 'not_found' };

    const { invite, organizationId } = row;

    const status = inviteStatusAt(invite);
    const session = await getServerSession();
    const user = session?.user ?? null;

    if (status === ProjectInviteStatus.REVOKED) return { state: 'revoked' };
    if (status === ProjectInviteStatus.EXPIRED) return { state: 'expired' };
    if (status === ProjectInviteStatus.ACCEPTED) {
        if (user && invite.acceptedBy === user.id) {
            return { state: 'already_member', projectId: invite.projectId };
        }

        return { state: 'used' };
    }

    const preview: InviteView = {
        projectId: invite.projectId,
        projectName: row.projectName,
        organizationName: row.organizationName,
        inviterName: row.inviterName ?? row.inviterEmail ?? null,
    };

    if (!user) {
        return {
            state: 'needs_auth',
            token,
            preview,
            invitedEmail: invite.email,
        };
    }

    if (
        invite.email &&
        invite.email.toLowerCase() !== (user.email ?? '').toLowerCase()
    ) {
        return {
            state: 'email_mismatch',
            invitedEmail: invite.email,
            currentEmail: user.email ?? '',
        };
    }

    const [[orgMember], activeMember] = await Promise.all([
        db
            .select({
                organizationId: organizationMembers.organizationId,
                organizationName: organizations.name,
            })
            .from(organizationMembers)
            .innerJoin(
                organizations,
                eq(organizations.id, organizationMembers.organizationId),
            )
            .where(eq(organizationMembers.userId, user.id))
            .limit(1),
        findActiveProjectMember(invite.projectId, user.id),
    ]);

    if (orgMember && orgMember.organizationId !== organizationId) {
        return {
            state: 'other_org',
            currentOrgName: orgMember.organizationName,
        };
    }
    if (activeMember) {
        return { state: 'already_member', projectId: invite.projectId };
    }

    return { state: 'ready', token, preview };
}
