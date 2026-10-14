import type { NullToOptional } from '@/shared/lib/optional';
import type {
    ProjectEmployeeRatesView as ServerProjectEmployeeRatesView,
    ProjectEmployeeView as ServerProjectEmployeeView,
} from './EmployeeAssignment.types';

export * from './EmployeeAssignment.actions';
export * from './EmployeeAssignment.schema';
export * from './EmployeeAssignment.types';
export * from './useEmployeeAssignments';

export type ProjectEmployeeRatesView =
    NullToOptional<ServerProjectEmployeeRatesView>;
export type ProjectEmployeeView = NullToOptional<ServerProjectEmployeeView>;
