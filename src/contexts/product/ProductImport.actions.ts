'use server';

import { projectMutationAction } from '@/shared/api/action-client';
import { Permission } from '@/contexts/user/User.types';
import { findWarehouseInProject } from '@/contexts/warehouse/Warehouse.lib';
import { ImportProductsActionInputSchema } from './Product.schema';
import { importProducts } from './ProductImport.lib';

export const importProductsAction = projectMutationAction(
    Permission.MANAGE_CATALOG,
)
    .inputSchema(ImportProductsActionInputSchema)
    .action(
        async ({
            parsedInput: { projectId, warehouseId, rows },
            ctx: { userId, organizationId },
        }) => {
            const warehouse = await findWarehouseInProject(
                warehouseId,
                projectId,
            );

            return importProducts(
                {
                    projectId,
                    organizationId,
                    warehouseId: warehouse.id,
                    createdBy: userId,
                },
                rows,
            );
        },
    );
