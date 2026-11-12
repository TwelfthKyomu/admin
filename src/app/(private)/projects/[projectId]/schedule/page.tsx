import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('schedule') };

export { ScheduleProjectPage as default } from '@/presentation/projects/[projectId]/schedule';
