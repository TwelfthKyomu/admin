import { createOptions } from '@/shared/lib/createOptions';
import { enumValues } from '@/shared/lib/enum';

export const Currency = {
    RUB: 'RUB',
    USD: 'USD',
    EUR: 'EUR',
    KZT: 'KZT',
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];

export const CURRENCY_VALUES = enumValues(Currency);

const CURRENCY_LABEL: Record<Currency, string> = {
    [Currency.RUB]: '₽ RUB',
    [Currency.USD]: '$ USD',
    [Currency.EUR]: '€ EUR',
    [Currency.KZT]: '₸ KZT',
};

export const CURRENCY_SYMBOL: Record<Currency, string> = {
    [Currency.RUB]: '₽',
    [Currency.USD]: '$',
    [Currency.EUR]: '€',
    [Currency.KZT]: '₸',
};

export const DEFAULT_CURRENCY: Currency = Currency.RUB;

function isCurrency(value: string): value is Currency {
    return (CURRENCY_VALUES as string[]).includes(value);
}

export function toCurrency(value: string): Currency {
    return isCurrency(value) ? value : DEFAULT_CURRENCY;
}

export const CURRENCY_OPTIONS = createOptions(CURRENCY_VALUES, CURRENCY_LABEL);
