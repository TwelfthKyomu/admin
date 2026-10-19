'use server';

import { db } from '@/infrastructure/database/client';
import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { findInProject, insertOne } from '@/shared/api/repository';
import { recordAudit } from '@/contexts/auditLog/AuditLog.lib';
import {
    AuditAction,
    AuditTargetType,
} from '@/contexts/auditLog/AuditLog.types';
import {
    lockEmployees,
    memberNamesByIds,
} from '@/contexts/organizationMember/OrganizationMember.lib';
import { Permission } from '@/contexts/user/User.types';
import { eq } from 'drizzle-orm';
import {
    assertPayrollPeriod,
    findOverlappingPayouts,
    findPayrollAssignments,
    loadPayrollActivity,
    payoutInputsOf,
} from './Payout.lib';
import {
    DeletePayoutActionInputSchema,
    PayrollPreviewActionInputSchema,
    RecordPayoutActionInputSchema,
} from './Payout.schema';
import {
    calcPayout,
    isPreSalesSnapshot,
    type PayrollRowView,
} from './Payout.types';
import { payouts } from './Payouts.table';

export const payrollPreviewAction = projectReadAction(Permission.VIEW_FINANCES)
    .inputSchema(PayrollPreviewActionInputSchema)
    .action(async ({ parsedInput: { projectId, from, to } }) => {
        assertPayrollPeriod(from, to);

        const period = { projectId, from, to };

        const [assignments, activity, existingPayouts] = await Promise.all([
            findPayrollAssignments(db, period),
            loadPayrollActivity(projectId, from, to),
            findOverlappingPayouts(db, period),
        ]);

        const payoutsByEmployee = Map.groupBy(
            existingPayouts,
            (payout) => payout.employeeId,
        );

        const nameById = await memberNamesByIds(
            assignments.map((assignment) => assignment.employeeId),
        );

        return assignments.map<PayrollRowView>((assignment) => {
            const inputs = payoutInputsOf(assignment, activity);
            const live = { ...inputs, ...calcPayout(inputs) };

            const employeePayouts =
                payoutsByEmployee.get(assignment.employeeId) ?? [];

            const payout = employeePayouts[0] ?? null;

            const snapshot =
                payout &&
                payout.periodStart.getTime() === from.getTime() &&
                payout.periodEnd.getTime() === to.getTime()
                    ? payout
                    : null;

            const shown = snapshot ?? live;

            return {
                employeeId: assignment.employeeId,
                assignmentId: assignment.id,
                employeeName:
                    nameById.get(assignment.employeeId) ??
                    'Удалённый сотрудник',
                position: assignment.position,
                kind: assignment.kind,
                shiftsCount: shown.shiftsCount,
                shiftRateAmount: shown.shiftRateAmount,
                storeRevenue: shown.storeRevenue,
                commissionRate: shown.commissionRate,
                siteRevenue: shown.siteRevenue,
                siteCommissionRate: shown.siteCommissionRate ?? 0,
                deliveriesCount: shown.deliveriesCount,
                deliveryRateAmount: shown.deliveryRateAmount,
                shiftsPay: shown.shiftsPay,
                commissionPay: shown.commissionPay,
                siteCommissionPay: shown.siteCommissionPay,
                deliveriesPay: shown.deliveriesPay,
                totalAmount: shown.totalAmount,
                payoutId: payout?.id ?? null,
                paidAt: payout?.createdAt ?? null,
                paidAmount: employeePayouts.reduce(
                    (sum, item) => sum + item.totalAmount,
                    0,
                ),
                recalculatedTotal:
                    snapshot &&
                    !isPreSalesSnapshot(snapshot) &&
                    snapshot.totalAmount !== live.totalAmount
                        ? live.totalAmount
                        : null,
            };
        });
    });

export const recordPayoutAction = projectMutationAction(
    Permission.MANAGE_FINANCES,
)
    .inputSchema(RecordPayoutActionInputSchema)
    .action(
        async ({
            parsedInput: { projectId, employeeId, from, to },
            ctx: { userId, organizationId },
        }) => {
            assertPayrollPeriod(from, to);

            const activity = await loadPayrollActivity(projectId, from, to);

            const payout = await db.transaction(async (tx) => {
                await lockEmployees(tx, [employeeId]);

                const period = { projectId, from, to, employeeId };

                const [[assignment], overlapping] = await Promise.all([
                    findPayrollAssignments(tx, period),
                    findOverlappingPayouts(tx, period),
                ]);

                if (!assignment) {
                    throw new ApplicationError(
                        'Сотрудник не работал в проекте в этот период',
                    );
                }
                if (overlapping.length > 0) {
                    throw new ApplicationError(
                        'За часть этого периода сотруднику уже зафиксирована выплата',
                    );
                }

                const inputs = payoutInputsOf(assignment, activity);

                return insertOne(
                    payouts,
                    {
                        projectId,
                        organizationId,
                        employeeId,
                        periodStart: from,
                        periodEnd: to,
                        ...inputs,
                        ...calcPayout(inputs),
                    },
                    'Не удалось зафиксировать выплату',
                    tx,
                );
            });

            await recordAudit({
                organizationId,
                projectId,
                actorUserId: userId,
                action: AuditAction.PayoutRecorded,
                targetType: AuditTargetType.Payout,
                targetId: payout.id,
                summary: 'Зафиксирована выплата сотруднику',
                metadata: {
                    employeeId,
                    totalAmount: payout.totalAmount,
                    periodStart: from.toISOString(),
                    periodEnd: to.toISOString(),
                },
            });

            return payout;
        },
    );

export const deletePayoutAction = projectMutationAction(
    Permission.MANAGE_FINANCES,
)
    .inputSchema(DeletePayoutActionInputSchema)
    .action(
        async ({
            parsedInput: { projectId, payoutId },
            ctx: { userId, organizationId },
        }) => {
            const payout = await findInProject(
                payouts,
                payoutId,
                projectId,
                'Выплата не найдена',
            );

            await db.delete(payouts).where(eq(payouts.id, payout.id));

            await recordAudit({
                organizationId,
                projectId,
                actorUserId: userId,
                action: AuditAction.PayoutDeleted,
                targetType: AuditTargetType.Payout,
                targetId: payout.id,
                summary: 'Отменена выплата сотруднику',
                metadata: {
                    employeeId: payout.employeeId,
                    totalAmount: payout.totalAmount,
                    periodStart: payout.periodStart.toISOString(),
                    periodEnd: payout.periodEnd.toISOString(),
                },
            });

            return { ok: true };
        },
    );
