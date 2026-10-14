import type { NullToOptional } from '@/shared/lib/optional';
import type { ReplacementShiftView as ServerReplacementShiftView } from './EmployeeShift.types';
import type { EmployeeShiftView as ServerEmployeeShiftView } from './EmployeeShifts.table';

export * from './EmployeeShift.actions';
export * from './EmployeeShift.schema';
export * from './EmployeeShift.types';
export * from './useEmployeeShifts';

export type ReplacementShiftView = NullToOptional<ServerReplacementShiftView>;
export type EmployeeShiftView = NullToOptional<ServerEmployeeShiftView>;
