import type { Currency } from '@/shared/constants/currency';
import { fmtMoney } from '@/shared/format/money';
import { CashMovementKind, type CashMovementView } from '@/contexts/cashShift';

const MOVEMENT_TEXT: Record<CashMovementKind, (note?: string) => string> = {
    [CashMovementKind.OPENING]: () => 'Смена открыта',
    [CashMovementKind.HANDOVER]: (note) => `Сдал ${note ?? 'курьер'}`,
    [CashMovementKind.COLLECTION]: (note) =>
        note ? `Инкассация · ${note}` : 'Инкассация',
    [CashMovementKind.REFUND]: (note) =>
        note ? `Возврат наличными · ${note}` : 'Возврат наличными',
};

export function movementText(item: CashMovementView): string {
    return MOVEMENT_TEXT[item.kind](item.note);
}

export function movementAmountClass(item: CashMovementView): string {
    if (item.kind === CashMovementKind.OPENING) return 'text-muted-foreground';

    return item.amount >= 0
        ? 'text-green-700 dark:text-green-400'
        : 'text-destructive';
}

export function signedMoney(amount: number, currency: Currency): string {
    return amount > 0
        ? `+${fmtMoney(amount, currency)}`
        : fmtMoney(amount, currency);
}
