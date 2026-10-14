import { EmptyState, Widget, WidgetBody, WidgetHeader } from '@/shared/components/common';
import { fmtMoney } from '@/shared/format/money';
import { PRODUCT_TYPE_LABEL } from '@/shared/labels/catalog';
import type { TopOrderItemView } from '@/contexts/order';
import { toProductType } from '@/contexts/product';
import { Progress } from '@/ui/Base';
import { Package } from 'lucide-react';
import { topItemRows } from '../lib/shares';

interface TopItemsProps {
    items: TopOrderItemView[];
}

export const TopItems = ({ items }: TopItemsProps) => (
    <Widget
        padding="md"
        className="gap-3"
    >
        <WidgetHeader icon={<Package className="size-4" />}>Топ товаров и услуг</WidgetHeader>
        <WidgetBody>
            {items.length === 0 ? (
                <EmptyState
                    icon={Package}
                    title="Нет оплаченных позиций"
                    description="Топ появится после первого оплаченного заказа."
                    className="py-6"
                />
            ) : (
                <ol className="flex flex-col gap-3 py-1">
                    {topItemRows(items).map((item, index) => (
                        <li
                            key={`${item.type}:${item.name}:${item.currency}`}
                            className="flex flex-col gap-1.5"
                        >
                            <div className="flex items-baseline justify-between gap-3 text-sm">
                                <span className="flex min-w-0 items-baseline gap-2">
                                    <span className="w-4 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                                        {index + 1}
                                    </span>
                                    <span className="truncate">{item.name}</span>
                                    <span className="shrink-0 text-[11px] text-muted-foreground">
                                        {PRODUCT_TYPE_LABEL[toProductType(item.type)]}
                                    </span>
                                </span>
                                <span className="shrink-0 tabular-nums">
                                    <span className="font-medium">
                                        {fmtMoney(item.revenueAmount, item.currency)}
                                    </span>
                                    <span className="ml-1.5 text-[11px] text-muted-foreground">
                                        ×{item.quantity}
                                    </span>
                                </span>
                            </div>
                            <Progress
                                value={item.share}
                                className="ml-6 h-1 w-auto"
                            />
                        </li>
                    ))}
                </ol>
            )}
        </WidgetBody>
    </Widget>
);
