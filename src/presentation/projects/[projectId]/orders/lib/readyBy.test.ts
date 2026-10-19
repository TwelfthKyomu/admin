import { describe, expect, it } from 'vitest';
import { readyByOf } from './readyBy';

describe('срок готовности', () => {
    it('без даты срока нет', () => {
        expect(readyByOf(undefined, '12:00')).toBeUndefined();
    });

    it('дата и время складываются в один момент', () => {
        expect(readyByOf(new Date('2026-10-24T00:00'), '15:30')).toEqual(
            new Date('2026-10-24T15:30'),
        );
    });

    it('без времени — к концу рабочего дня', () => {
        expect(readyByOf(new Date('2026-10-24T00:00'), '')).toEqual(
            new Date('2026-10-24T18:00'),
        );
    });
});
