import { ProjectRole } from '@/contexts/project/Project.types';
import { describe, expect, it } from 'vitest';
import { worksShifts } from './EmployeeAssignment.types';

describe('worksShifts', () => {
    it('в графике все, кроме наблюдателя и бухгалтера', () => {
        expect(worksShifts(ProjectRole.EDITOR)).toBe(true);
        expect(worksShifts(ProjectRole.COURIER)).toBe(true);
        expect(worksShifts(null)).toBe(true);
        expect(worksShifts(ProjectRole.VIEWER)).toBe(false);
        expect(worksShifts(ProjectRole.ACCOUNTANT)).toBe(false);
    });
});
