import 'server-only';

import { db } from '@/infrastructure/database/client';
import { findInProject } from '@/shared/api/repository';
import { and, eq, isNull } from 'drizzle-orm';
import {
    type ProjectMemberRecord,
    projectMembers,
} from './ProjectMembers.table';

export async function findActiveProjectMember(
    projectId: string,
    userId: string,
): Promise<Pick<ProjectMemberRecord, 'id' | 'role'> | null> {
    const [member] = await db
        .select({ id: projectMembers.id, role: projectMembers.role })
        .from(projectMembers)
        .where(
            and(
                eq(projectMembers.projectId, projectId),
                eq(projectMembers.userId, userId),
                isNull(projectMembers.leftAt),
            ),
        )
        .limit(1);

    return member ?? null;
}

export function findProjectMemberInProject(
    memberId: string,
    projectId: string,
): Promise<ProjectMemberRecord> {
    return findInProject(
        projectMembers,
        memberId,
        projectId,
        'Участник не найден',
    );
}
