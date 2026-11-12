import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('looks') };

export { LooksPage as default } from '@/presentation/projects/[projectId]/looks';
