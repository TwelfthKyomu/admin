import { describe, expect, it } from 'vitest';
import { defaultAttributesFor, ProductType } from './Product.types';

describe('атрибуты услуги', () => {
    it('у услуги нет атрибутов записи', () => {
        expect(defaultAttributesFor(ProductType.SERVICE)).toEqual({});
    });
});
