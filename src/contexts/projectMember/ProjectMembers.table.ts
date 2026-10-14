import { id } from '@/infrastructure/database/columns';
import { projectRoleEnum } from '@/infrastructure/database/schemas/enums';
import { ProjectRole } from '@/contexts/project/Project.types';
import { projects } from '@/contexts/project/Projects.table';
import { users } from '@/contexts/user/Users.table';
import {
    index,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
} from 'drizzle-orm/pg-core';

export const projectMembers = pgTable(
    'project_members',
    {
        id,
        userId: text('user_id')
            .notNull()
            .references(() => users.id, { onDelete: 'cascade' }),
        projectId: text('project_id')
            .notNull()
            .references(() => projects.id, { onDelete: 'cascade' }),
        role: projectRoleEnum('role').notNull().default(ProjectRole.MASTER),
        joinedAt: timestamp('joined_at').notNull().defaultNow(),
        leftAt: timestamp('left_at'),
    },
    (t) => [
        uniqueIndex('uq_project_members').on(t.userId, t.projectId),
        index('idx_project_members_project').on(t.projectId),
    ],
);

export type ProjectMemberRecord = typeof projectMembers.$inferSelect;
