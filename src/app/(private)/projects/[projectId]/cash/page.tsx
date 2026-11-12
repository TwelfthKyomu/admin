import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('cash') };

export { CashPage as default } from '@/presentation/projects/[projectId]/cash';
