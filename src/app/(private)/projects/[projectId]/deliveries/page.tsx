import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('deliveries') };

export { DeliveriesPage as default } from '@/presentation/projects/[projectId]/deliveries';
