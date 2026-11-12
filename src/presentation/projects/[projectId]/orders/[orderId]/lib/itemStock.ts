import type { NullToOptional } from '@/shared/lib/optional';
import type { OrderItemView } from '@/contexts/order';
import { type OrderStockLine, stockKey } from '@/contexts/stockMovement';

export const itemStockLabel = (
    item: OrderItemView,
    lines: NullToOptional<OrderStockLine>[],
    warehouseNames: Map<string, string>,
): string | undefined => {
    if (!item.productId) return undefined;

    const key = stockKey({
        productId: item.productId,
        variantId: item.variantId ?? null,
    });

    const parts = lines
        .filter(
            (line) =>
                stockKey({ ...line, variantId: line.variantId ?? null }) ===
                key,
        )
        .map((line) => {
            const warehouse =
                warehouseNames.get(line.warehouseId) ?? 'Удалённый склад';

            const state = line.reserved ? 'бронь' : 'списано';

            return `${warehouse}: ${state} ${line.quantity} шт`;
        });

    return parts.length > 0 ? parts.join(' · ') : undefined;
};
