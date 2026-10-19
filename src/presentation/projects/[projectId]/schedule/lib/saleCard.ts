import { pluralRu } from '@/shared/format/plural';
import type { OrderListView } from '@/contexts/order';

const ITEMS_PLURAL: [string, string, string] = ['товар', 'товара', 'товаров'];

export function saleCardLabel(
    amount: string,
    order: Pick<OrderListView, 'itemsCount'>,
): string {
    return `${amount} · ${order.itemsCount} ${pluralRu(order.itemsCount, ITEMS_PLURAL)}`;
}
