import type { OrganizationRole } from '@/contexts/organizationMember/OrganizationMember.types';
import type { ProjectRole } from '@/contexts/project/Project.types';
import type { UserRecord } from '@/contexts/user/Users.table';
import type { ProjectMemberRecord } from './ProjectMembers.table';

export type ProjectMemberView = Pick<
    ProjectMemberRecord,
    'id' | 'userId' | 'joinedAt'
> & {
    projectRole: ProjectRole;
    userName: UserRecord['name'];
    userEmail: UserRecord['email'];
    organizationRole: OrganizationRole | null;
    inSchedule: boolean;
};
