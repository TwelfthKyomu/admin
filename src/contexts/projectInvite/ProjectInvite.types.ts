export const ProjectInviteStatus = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    REVOKED: 'revoked',
    EXPIRED: 'expired',
} as const;

export type ProjectInviteStatus =
    (typeof ProjectInviteStatus)[keyof typeof ProjectInviteStatus];

export const INVITE_TTL_DAYS = 14;

export function inviteStatusAt(
    invite: {
        revokedAt?: Date | null;
        acceptedAt?: Date | null;
        expiresAt: Date;
    },
    now: Date = new Date(),
): ProjectInviteStatus {
    if (invite.revokedAt) return ProjectInviteStatus.REVOKED;
    if (invite.acceptedAt) return ProjectInviteStatus.ACCEPTED;
    if (now > new Date(invite.expiresAt)) return ProjectInviteStatus.EXPIRED;

    return ProjectInviteStatus.PENDING;
}

export interface InviteView {
    projectId: string;
    projectName: string;
    organizationName: string;
    inviterName: string | null;
}

export type InviteStateView =
    | { state: 'not_found' }
    | { state: 'revoked' }
    | { state: 'expired' }
    | { state: 'used' }
    | {
          state: 'needs_auth';
          token: string;
          preview: InviteView;
          invitedEmail: string | null;
      }
    | { state: 'email_mismatch'; invitedEmail: string; currentEmail: string }
    | { state: 'other_org'; currentOrgName: string | null }
    | { state: 'already_member'; projectId: string }
    | { state: 'ready'; token: string; preview: InviteView };
