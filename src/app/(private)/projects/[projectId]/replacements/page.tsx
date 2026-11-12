import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('replacements') };

export { ReplacementsPage as default } from '@/presentation/projects/[projectId]/replacements';
