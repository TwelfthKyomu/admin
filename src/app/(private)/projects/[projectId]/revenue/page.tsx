import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('revenue') };

export { RevenuePage as default } from '@/presentation/projects/[projectId]/revenue';
