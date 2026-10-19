'use server';

import { organizationMemberAction } from '@/shared/api/action-client';
import { listProjectPermissions } from '@/shared/api/permission';
import { listCourierDeliveriesInWork } from '@/contexts/delivery/Delivery.lib';
import { findActiveAssignmentsOfEmployee } from '@/contexts/employeeAssignment/EmployeeAssignment.lib';
import { listEmployeeShiftsBetween } from '@/contexts/employeeShift/EmployeeShift.lib';
import { findMemberIdByUserId } from '@/contexts/organizationMember/OrganizationMember.lib';
import { listOrganizationProjects } from '@/contexts/project/Project.lib';
import { listAssignedTasks } from '@/contexts/task/Task.lib';
import { Permission } from '@/contexts/user/User.types';
import {
    MyDayActionInputSchema,
    MySalesActionInputSchema,
} from './Order.schema';
import {
    type DashboardView,
    type MyDayView,
    type MySalesView,
    summarizeSales,
} from './Order.types';
import { aggregateSellerRevenue, loadDashboardStats } from './OrderStats.lib';

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
                    deliveries: [],
                    tasks: await listAssignedTasks(userId, taskProjectIds),
                };
            }

            const [shifts, deliveries, tasks] = await Promise.all([
                listEmployeeShiftsBetween(employeeId, from, to),
                listCourierDeliveriesInWork(employeeId),
                listAssignedTasks(userId, taskProjectIds),
            ]);

            return { shifts, deliveries, tasks };
        },
    );

export const mySalesAction = organizationMemberAction()
    .inputSchema(MySalesActionInputSchema)
    .action(
        async ({
            parsedInput: { dayFrom, monthFrom, to },
            ctx: { userId, organizationId },
        }): Promise<MySalesView[]> => {
            const employeeId = await findMemberIdByUserId(
                organizationId,
                userId,
            );

            if (!employeeId) return [];

            const [assignments, projects] = await Promise.all([
                findActiveAssignmentsOfEmployee(employeeId),
                listOrganizationProjects(organizationId),
            ]);

            const projectById = new Map(
                projects.map((project) => [project.id, project]),
            );

            const sales = assignments.flatMap((assignment) => {
                const project = projectById.get(assignment.projectId);

                return project ? [{ assignment, project }] : [];
            });

            return Promise.all(
                sales.map(async ({ assignment, project }) => {
                    const rates = {
                        commissionRate: assignment.commissionRate ?? 0,
                        siteCommissionRate: assignment.siteCommissionRate ?? 0,
                    };

                    const [today, month] = await Promise.all([
                        aggregateSellerRevenue(
                            project.id,
                            dayFrom,
                            to,
                            employeeId,
                        ),
                        aggregateSellerRevenue(
                            project.id,
                            monthFrom,
                            to,
                            employeeId,
                        ),
                    ]);

                    return {
                        projectId: project.id,
                        currency: project.defaultCurrency,
                        today: summarizeSales(today, rates),
                        month: summarizeSales(month, rates),
                    };
                }),
            );
        },
    );
