'use server';

import { organizationMemberAction } from '@/shared/api/action-client';
import { listProjectPermissions } from '@/shared/api/permission';
import { listCourierDeliveriesInWork } from '@/contexts/delivery/Delivery.lib';
import { listEmployeeShiftsBetween } from '@/contexts/employeeShift/EmployeeShift.lib';
import { findMemberIdByUserId } from '@/contexts/organizationMember/OrganizationMember.lib';
import { listOrganizationProjects } from '@/contexts/project/Project.lib';
import { listAssignedTasks } from '@/contexts/task/Task.lib';
import { Permission } from '@/contexts/user/User.types';
import { MyDayActionInputSchema } from './Order.schema';
import type { DashboardView, MyDayView } from './Order.types';
import { listEmployeeBookings } from './OrderBooking.lib';
import { loadDashboardStats } from './OrderStats.lib';

export const dashboardAction = organizationMemberAction().action(
    async ({ ctx: { userId, organizationId } }): Promise<DashboardView> => {
        const [all, permissions] = await Promise.all([
            listOrganizationProjects(organizationId),
            listProjectPermissions(userId),
        ]);

        const projects = all.filter((project) =>
            permissions[project.id]?.includes(Permission.VIEW_FINANCES),
        );

        const stats = await loadDashboardStats(projects);

        return { projects, stats };
    },
);

export const myDayAction = organizationMemberAction()
    .inputSchema(MyDayActionInputSchema)
    .action(
        async ({
            parsedInput: { from, to },
            ctx: { userId, organizationId },
        }): Promise<MyDayView> => {
            const [employeeId, permissions] = await Promise.all([
                findMemberIdByUserId(organizationId, userId),
                listProjectPermissions(userId),
            ]);

            const taskProjectIds = Object.keys(permissions).filter(
                (projectId) =>
                    permissions[projectId]?.includes(Permission.VIEW_MEMBERS),
            );

            if (!employeeId) {
                return {
                    shifts: [],
                    bookings: [],
                    deliveries: [],
                    tasks: await listAssignedTasks(userId, taskProjectIds),
                };
            }

            const [shifts, bookings, deliveries, tasks] = await Promise.all([
                listEmployeeShiftsBetween(employeeId, from, to),
                listEmployeeBookings(employeeId, from, to),
                listCourierDeliveriesInWork(employeeId),
                listAssignedTasks(userId, taskProjectIds),
            ]);

            return { shifts, bookings, deliveries, tasks };
        },
    );
