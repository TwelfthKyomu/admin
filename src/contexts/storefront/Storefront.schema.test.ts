import { describe, expect, it } from 'vitest';
import {
    StorefrontOrderInputSchema,
    StorefrontPasswordResetInputSchema,
} from './Storefront.schema';

const item = { productId: 'p1', quantity: 1 };

describe('заказ с витрины', () => {
    it('нужен email или телефон покупателя', () => {
        const parsed = StorefrontOrderInputSchema.safeParse({
            customerName: 'Анна',
            items: [item],
        });

        expect(parsed.success).toBe(false);
    });

    it('email приводится к нижнему регистру', () => {
        const parsed = StorefrontOrderInputSchema.parse({
            customerName: ' Анна ',
            customerEmail: ' Anna@Example.COM ',
            items: [item],
        });

        expect(parsed.customerName).toBe('Анна');
        expect(parsed.customerEmail).toBe('anna@example.com');
    });

    it('цены сайт не присылает, количество — от одного', () => {
        const parsed = StorefrontOrderInputSchema.parse({
            customerName: 'Анна',
            customerPhone: '+79990000000',
            items: [{ ...item, unitPriceAmount: 1 }],
        });

        expect(parsed.items[0]).toEqual(item);

        expect(
            StorefrontOrderInputSchema.safeParse({
                customerName: 'Анна',
                customerPhone: '+79990000000',
                items: [{ ...item, quantity: 0 }],
            }).success,
        ).toBe(false);
    });
});

describe('сброс пароля покупателя', () => {
    const input = {
        email: ' Anna@Example.COM ',
        code: '123456',
        password: 'новыйпароль',
    };

    it('почта приводится к нижнему регистру', () => {
        expect(StorefrontPasswordResetInputSchema.parse(input).email).toBe(
            'anna@example.com',
        );
    });

    it('код — ровно 6 цифр', () => {
        expect(
            StorefrontPasswordResetInputSchema.safeParse({
                ...input,
                code: '12345',
            }).success,
        ).toBe(false);
    });

    it('пароль не короче 8 символов', () => {
        expect(
            StorefrontPasswordResetInputSchema.safeParse({
                ...input,
                password: 'корот',
            }).success,
        ).toBe(false);
    });
});
