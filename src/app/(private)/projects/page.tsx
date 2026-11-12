import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('projects') };

export { ProjectsPage as default } from '@/presentation/projects';
