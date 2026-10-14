import type { NullToOptional } from '@/shared/lib/optional';
import type { MyTaskView as ServerMyTaskView } from './Task.types';
import type { TaskView as ServerTaskView } from './Tasks.table';

export * from './Task.actions';
export * from './Task.schema';
export * from './Task.types';
export * from './useTasks';

export type MyTaskView = NullToOptional<ServerMyTaskView>;
export type TaskView = NullToOptional<ServerTaskView>;
