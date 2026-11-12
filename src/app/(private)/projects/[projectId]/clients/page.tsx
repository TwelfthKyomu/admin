import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('clients') };

export { ClientsPage as default } from '@/presentation/projects/[projectId]/clients';
