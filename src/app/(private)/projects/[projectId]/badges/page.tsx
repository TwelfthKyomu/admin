import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('badges') };

export { BadgesPage as default } from '@/presentation/projects/[projectId]/badges';
