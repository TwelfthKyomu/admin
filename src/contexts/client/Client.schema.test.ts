import { describe, expect, it } from 'vitest';
import { CreateClientActionInputSchema } from './Client.schema';

describe('клиент из админки', () => {
    it('достаточно имени и телефона', () => {
        const parsed = CreateClientActionInputSchema.safeParse({
            projectId: 'p1',
            firstName: 'Анна',
            phone: '+79990000000',
            email: '',
        });

        expect(parsed.success).toBe(true);
    });

    it('без контакта и с пустым именем — ошибка', () => {
        expect(
            CreateClientActionInputSchema.safeParse({
                projectId: 'p1',
                firstName: 'Анна',
            }).success,
        ).toBe(false);

        expect(
            CreateClientActionInputSchema.safeParse({
                projectId: 'p1',
                firstName: '   ',
                phone: '+79990000000',
            }).success,
        ).toBe(false);
    });
});
