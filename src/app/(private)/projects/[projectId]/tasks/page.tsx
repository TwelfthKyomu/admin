import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('tasks') };

export { TasksPage as default } from '@/presentation/projects/[projectId]/tasks';
