import { describe, expect, it } from 'vitest';
import { isLetterShortcut } from './hotkey';

const press = (key: string, code: string, modifier?: 'ctrl' | 'meta') => ({
    key,
    code,
    ctrlKey: modifier === 'ctrl',
    metaKey: modifier === 'meta',
});

describe('сочетание Ctrl/⌘ + буква', () => {
    it('срабатывает в латинской раскладке', () => {
        expect(isLetterShortcut(press('k', 'KeyK', 'ctrl'), 'k')).toBe(true);
        expect(isLetterShortcut(press('k', 'KeyK', 'meta'), 'k')).toBe(true);
    });

    it('срабатывает в русской раскладке, где на клавише K стоит «л»', () => {
        expect(isLetterShortcut(press('л', 'KeyK', 'ctrl'), 'k')).toBe(true);
    });

    it('срабатывает с зажатым Caps Lock', () => {
        expect(isLetterShortcut(press('K', 'KeyK', 'ctrl'), 'k')).toBe(true);
    });

    it('срабатывает в раскладке, где буква K на другой клавише', () => {
        expect(isLetterShortcut(press('k', 'KeyV', 'ctrl'), 'k')).toBe(true);
    });

    it('не срабатывает без Ctrl или ⌘', () => {
        expect(isLetterShortcut(press('k', 'KeyK'), 'k')).toBe(false);
    });

    it('не срабатывает на другой клавише', () => {
        expect(isLetterShortcut(press('и', 'KeyB', 'ctrl'), 'k')).toBe(false);
    });
});
