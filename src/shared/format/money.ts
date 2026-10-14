import { type Currency, DEFAULT_CURRENCY } from '@/shared/constants/currency';

export function fmtMoney(
    amount: number,
    currency: Currency = DEFAULT_CURRENCY,
): string {
    try {
        return new Intl.NumberFormat('ru-RU', {
            style: 'currency',
            currency,
            maximumFractionDigits: 2,
        }).format(amount / 100);
    } catch {
        return `${(amount / 100).toFixed(2)} ${currency}`;
    }
}
