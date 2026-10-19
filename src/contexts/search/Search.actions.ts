'use server';

import { db } from '@/infrastructure/database/client';
import { organizationMemberAction } from '@/shared/api/action-client';
import { listProjectPermissions } from '@/shared/api/permission';
import { searchFilters } from '@/shared/api/repository';
import { clients } from '@/contexts/client/Clients.table';
import { orders } from '@/contexts/order/Orders.table';
import { products } from '@/contexts/product/Products.table';
import {
    CATALOG_READ_PERMISSIONS,
    Permission,
} from '@/contexts/user/User.types';
import { and, desc, inArray, isNull } from 'drizzle-orm';
import { SEARCH_RESULTS_LIMIT, SearchActionInputSchema } from './Search.schema';
import type { SearchResults } from './Search.types';

const FULL_BOOKING_ACCESS: Permission[] = [
    Permission.MANAGE_ORDERS,
    Permission.VIEW_ORDERS,
];

const CLIENT_ACCESS: Permission[] = [
    ...FULL_BOOKING_ACCESS,
    Permission.VIEW_FINANCES,
];

function projectsWith(
    permissions: Record<string, Permission[]>,
    required: Permission[],
): string[] {
    return Object.entries(permissions)
        .filter(([, granted]) =>
            granted.some((item) => required.includes(item)),
        )
        .map(([projectId]) => projectId);
}

export const searchAction = organizationMemberAction()
    .inputSchema(SearchActionInputSchema)
    .action(
        async ({
            parsedInput: { query },
            ctx: { userId },
        }): Promise<SearchResults> => {
            const permissions = await listProjectPermissions(userId);

            const orderProjects = projectsWith(
                permissions,
                FULL_BOOKING_ACCESS,
            );

            const clientProjects = projectsWith(permissions, CLIENT_ACCESS);

            const productProjects = projectsWith(
                permissions,
                CATALOG_READ_PERMISSIONS,
            );

            const [orderHits, clientHits, productHits] = await Promise.all([
                orderProjects.length === 0
                    ? []
                    : db
                          .select({
                              id: orders.id,
                              projectId: orders.projectId,
                              customerName: orders.customerName,
                              customerPhone: orders.customerPhone,
                              totalAmount: orders.totalAmount,
                              currency: orders.currency,
                          })
                          .from(orders)
                          .where(
                              and(
                                  inArray(orders.projectId, orderProjects),
                                  ...searchFilters(query, [
                                      orders.id,
                                      orders.customerName,
                                      orders.customerPhone,
                                      orders.customerEmail,
                                  ]),
                              ),
                          )
                          .orderBy(desc(orders.createdAt))
                          .limit(SEARCH_RESULTS_LIMIT),
                clientProjects.length === 0
                    ? []
                    : db
                          .select({
                              id: clients.id,
                              projectId: clients.projectId,
                              firstName: clients.firstName,
                              lastName: clients.lastName,
                              phone: clients.phone,
                              email: clients.email,
                          })
                          .from(clients)
                          .where(
                              and(
                                  inArray(clients.projectId, clientProjects),
                                  ...searchFilters(query, [
                                      clients.firstName,
                                      clients.lastName,
                                      clients.phone,
                                      clients.email,
                                  ]),
                              ),
                          )
                          .orderBy(desc(clients.createdAt))
                          .limit(SEARCH_RESULTS_LIMIT),
                productProjects.length === 0
                    ? []
                    : db
                          .select({
                              id: products.id,
                              projectId: products.projectId,
                              name: products.name,
                              sku: products.sku,
                          })
                          .from(products)
                          .where(
                              and(
                                  inArray(products.projectId, productProjects),
                                  isNull(products.deletedAt),
                                  ...searchFilters(query, [
                                      products.name,
                                      products.sku,
                                  ]),
                              ),
                          )
                          .orderBy(desc(products.createdAt))
                          .limit(SEARCH_RESULTS_LIMIT),
            ]);

            return {
                orders: orderHits,
                clients: clientHits,
                products: productHits,
            };
        },
    );
