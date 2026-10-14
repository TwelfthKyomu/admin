'use server';

import { db } from '@/infrastructure/database/client';
import {
    projectMutationAction,
    projectReadAction,
} from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { insertOne, updateOne } from '@/shared/api/repository';
import { findMemberIdByUserId } from '@/contexts/organizationMember/OrganizationMember.lib';
import { DELIVERY_PERMISSIONS, Permission } from '@/contexts/user/User.types';
import { eq } from 'drizzle-orm';
import {
    findOpenCashShift,
    listCourierBalances,
    loadCashRegister,
    lockOpenCashShift,
} from './CashShift.lib';
import {
    AcceptCourierCashActionInputSchema,
    CashRegisterSummaryActionInputSchema,
    CloseCashShiftActionInputSchema,
    OpenCashShiftActionInputSchema,
    RecordCashCollectionActionInputSchema,
} from './CashShift.schema';
import {
    cashCollections,
    cashShifts,
    courierHandovers,
} from './CashShifts.table';

export const cashRegisterSummaryAction = projectReadAction(
    Permission.VIEW_FINANCES,
)
    .inputSchema(CashRegisterSummaryActionInputSchema)
    .action(({ parsedInput: { projectId } }) => loadCashRegister(projectId));

export const myCourierCashAction = projectReadAction(DELIVERY_PERMISSIONS)
    .inputSchema(CashRegisterSummaryActionInputSchema)
    .action(
        async ({
            parsedInput: { projectId },
            ctx: { userId, organizationId },
        }) => {
            const employeeId = await findMemberIdByUserId(
                organizationId,
                userId,
            );

            if (!employeeId) return 0;

            const [balance] = await listCourierBalances(projectId, {
                employeeId,
            });

            return balance?.onHand ?? 0;
        },
    );

export const acceptCourierCashAction = projectMutationAction(
    Permission.MANAGE_FINANCES,
)
    .inputSchema(AcceptCourierCashActionInputSchema)
    .action(
        ({ parsedInput: { projectId, employeeId, amount }, ctx: { userId } }) =>
            db.transaction(async (tx) => {
                const shift = await lockOpenCashShift(
                    tx,
                    projectId,
                    'update',
                    'Откройте кассовую смену, чтобы принять деньги',
                );

                const [balance] = await listCourierBalances(projectId, {
                    employeeId,
                    executor: tx,
                });

                if (amount > (balance?.onHand ?? 0)) {
                    throw new ApplicationError(
                        'Сумма больше, чем на руках у курьера',
                    );
                }

                return insertOne(
                    courierHandovers,
                    {
                        cashShiftId: shift.id,
                        projectId,
                        employeeId,
                        amount,
                        createdBy: userId,
                    },
                    'Не удалось принять деньги',
                    tx,
                );
            }),
    );

export const openCashShiftAction = projectMutationAction(
    Permission.MANAGE_FINANCES,
)
    .inputSchema(OpenCashShiftActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        if (await findOpenCashShift(parsedInput.projectId)) {
            throw new ApplicationError('Кассовая смена уже открыта');
        }

        return insertOne(
            cashShifts,
            {
                projectId: parsedInput.projectId,
                openingAmount: parsedInput.openingAmount ?? 0,
                openedBy: userId,
            },
            'Не удалось открыть смену',
        );
    });

export const closeCashShiftAction = projectMutationAction(
    Permission.MANAGE_FINANCES,
)
    .inputSchema(CloseCashShiftActionInputSchema)
    .action(({ parsedInput, ctx: { userId } }) =>
        db.transaction(async (tx) => {
            const shift = await lockOpenCashShift(
                tx,
                parsedInput.projectId,
                'update',
                'Нет открытой кассовой смены',
            );

            return updateOne(
                cashShifts,
                eq(cashShifts.id, shift.id),
                {
                    closedBy: userId,
                    closingCountedAmount: parsedInput.countedAmount ?? 0,
                    closingNote: parsedInput.note?.trim() || null,
                    closedAt: new Date(),
                },
                'Не удалось закрыть смену',
                tx,
            );
        }),
    );

export const recordCashCollectionAction = projectMutationAction(
    Permission.MANAGE_FINANCES,
)
    .inputSchema(RecordCashCollectionActionInputSchema)
    .action(({ parsedInput, ctx: { userId } }) =>
        db.transaction(async (tx) => {
            const shift = await lockOpenCashShift(
                tx,
                parsedInput.projectId,
                'share',
                'Инкассация невозможна: нет открытой смены',
            );

            await tx.insert(cashCollections).values({
                cashShiftId: shift.id,
                amount: parsedInput.amount,
                note: parsedInput.note?.trim() || null,
                createdBy: userId,
            });

            return { ok: true };
        }),
    );
