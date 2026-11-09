import { describe, expect, it } from 'vitest';
import {
    parseAmount,
    parseImportRecord,
    parseQuantity,
} from './ProductImport.types';

describe('parseAmount', () => {
    it('понимает пробелы, запятую и знак рубля', () => {
        expect(parseAmount('1 990,50 ₽')).toBe(199050);
        expect(parseAmount('2500')).toBe(250000);
    });

    it('пустое — null, мусор — undefined', () => {
        expect(parseAmount('  ')).toBeNull();
        expect(parseAmount('дорого')).toBeUndefined();
        expect(parseAmount('-5')).toBeUndefined();
    });
});

describe('parseQuantity', () => {
    it('только целые неотрицательные', () => {
        expect(parseQuantity('12')).toBe(12);
        expect(parseQuantity('')).toBeNull();
        expect(parseQuantity('1,5')).toBeUndefined();
    });
});

describe('parseImportRecord', () => {
    it('сопоставляет колонки по названию без учёта регистра', () => {
        expect(
            parseImportRecord(
                {
                    Название: ' Футболка ',
                    Артикул: 'ts-01',
                    Цена: '1990',
                    Остаток: '5',
                    Лишняя: 'x',
                },
                2,
            ),
        ).toEqual({
            line: 2,
            row: {
                name: 'Футболка',
                sku: 'TS-01',
                price: 199000,
                costAmount: null,
                barcode: null,
                category: null,
                stock: 5,
                description: null,
            },
        });
    });

    it('объясняет, что не так в строке', () => {
        expect(
            parseImportRecord({ Название: 'Кепка', Цена: '500' }, 3),
        ).toEqual({
            line: 3,
            error: 'Нет артикула',
        });
    });
});

describe('проверка кодов', () => {
    it('артикул только латиницей', () => {
        expect(
            parseImportRecord(
                { Название: 'Кепка', Артикул: 'КЕП 1', Цена: '500' },
                4,
            ).error,
        ).toBe('Артикул — латинские буквы, цифры и дефис');
    });
});
