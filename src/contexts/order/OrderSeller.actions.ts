'use server';

import { db } from '@/infrastructure/database/client';
import { projectMutationAction } from '@/shared/api/action-client';
import { ApplicationError } from '@/shared/api/errors';
import { assertActiveAssignments } from '@/contexts/employeeAssignment/EmployeeAssignment.lib';
import { lockEmployees } from '@/contexts/organizationMember/OrganizationMember.lib';
import { findPayoutsCovering } from '@/contexts/payout/Payout.lib';
import { Permission } from '@/contexts/user/User.types';
import { lockOrder, setOrderSeller } from './Order.lib';
import { ChangeOrderSellerActionInputSchema } from './Order.schema';
import { OrderStatus } from './Order.types';

export const changeOrderSellerAction = projectMutationAction(
    Permission.MANAGE_MEMBERS,
)
    .inputSchema(ChangeOrderSellerActionInputSchema)
    .action(async ({ parsedInput, ctx: { userId } }) => {
        const { id, projectId, sellerId } = parsedInput;

        if (sellerId) await assertActiveAssignments(projectId, [sellerId]);

        return db.transaction(async (tx) => {
            const order = await lockOrder(tx, id, projectId);

            if (order.status === OrderStatus.CANCELLED) {
                throw new ApplicationError(
                    'Нельзя сменить продавца у отменённого заказа',
                );
            }
            if (order.sellerId === sellerId) return order;

            const employeeIds = [order.sellerId, sellerId].filter(
                (employeeId) => employeeId !== null,
            );

            if (order.completedAt && employeeIds.length > 0) {
                await lockEmployees(tx, employeeIds);

                const covering = await findPayoutsCovering(tx, {
                    projectId,
                    employeeIds,
                    at: order.completedAt,
                });

                if (covering.length > 0) {
                    throw new ApplicationError(
                        'Период уже выплачен: продавца нельзя сменить',
                    );
                }
            }

            return setOrderSeller(tx, order, sellerId, userId);
        });
    });
