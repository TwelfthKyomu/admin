import type { ClientRecord } from '@/contexts/client/Clients.table';
import type { OrderRecord } from '@/contexts/order/Orders.table';
import type { ProductRecord } from '@/contexts/product/Products.table';

export type SearchOrderHit = Pick<
    OrderRecord,
    | 'id'
    | 'projectId'
    | 'customerName'
    | 'customerPhone'
    | 'totalAmount'
    | 'currency'
>;

export type SearchClientHit = Pick<
    ClientRecord,
    'id' | 'projectId' | 'firstName' | 'lastName' | 'phone' | 'email'
>;

export type SearchProductHit = Pick<
    ProductRecord,
    'id' | 'projectId' | 'name' | 'sku'
>;

export interface SearchResults {
    orders: SearchOrderHit[];
    clients: SearchClientHit[];
    products: SearchProductHit[];
}
