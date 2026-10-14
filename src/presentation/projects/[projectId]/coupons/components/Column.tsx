import type { Currency } from '@/shared/constants/currency';
import { fmtDate } from '@/shared/format/date';
import { fmtMoney } from '@/shared/format/money';
import { COUPON_STATUS_LABEL, COUPON_STATUS_VARIANT } from '@/shared/labels/catalog';
import { CouponDiscountType, type CouponView } from '@/contexts/coupon';
import { Badge } from '@/ui/Base';
import { editDeleteColumn } from '@/ui/Base/Table';
import { createColumnHelper } from '@tanstack/react-table';

const { display, accessor } = createColumnHelper<CouponView>();

interface ColumnsProps {
    currency: Currency;
    onEdit: (coupon: CouponView) => void;
    onDelete: (coupon: CouponView) => void;
    isDeleting: boolean;
}

export const COLUMNS = ({ currency, ...actions }: ColumnsProps) => [
    accessor('code', {
        header: 'Код',
        cell: ({ getValue }) => <code>{getValue()}</code>,
    }),
    accessor('label', {
        header: 'Название',
    }),
    accessor('discountValue', {
        header: 'Скидка',
        cell: ({ row: { original } }) => {
            const value =
                original.discountType === CouponDiscountType.PERCENTAGE
                    ? `${original.discountValue}%`
                    : fmtMoney(original.discountValue, currency);

            const rulesCount = original.scope.rules.length;

            return rulesCount > 0 ? (
                <span>
                    {value}{' '}
                    <span className="text-muted-foreground text-xs">· условий: {rulesCount}</span>
                </span>
            ) : (
                value
            );
        },
    }),
    display({
        id: 'uses',
        header: 'Использовано',
        cell: ({ row: { original } }) => {
            const total = `${original.usesCount} / ${original.maxUses ?? '∞'}`;

            return original.maxUsesPerClient
                ? `${total} (≤ ${original.maxUsesPerClient} на клиента)`
                : total;
        },
    }),
    display({
        id: 'validity',
        header: 'Период',
        cell: ({ row: { original } }) => {
            if (!original.validFrom && !original.validUntil) return 'Бессрочно';

            const from = original.validFrom ? fmtDate(original.validFrom) : '…';
            const until = original.validUntil ? fmtDate(original.validUntil) : '…';

            return `${from} — ${until}`;
        },
    }),
    accessor('status', {
        header: 'Статус',
        cell: ({ getValue }) => (
            <Badge variant={COUPON_STATUS_VARIANT[getValue()]}>
                {COUPON_STATUS_LABEL[getValue()]}
            </Badge>
        ),
    }),
    editDeleteColumn(actions),
];
