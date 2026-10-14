import { describe, expect, it } from 'vitest';
import { expectedCashOf } from './CashShift.types';

describe('expectedCashOf', () => {
    it('размен + наличные оплаты − возвраты + сдача курьеров − инкассация', () => {
        expect(
            expectedCashOf({
                openingAmount: 500_000,
                registerCharges: 1_200_000,
                registerRefunds: 100_000,
                handovers: 300_000,
                collections: 1_000_000,
            }),
        ).toBe(900_000);
    });
});
