import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('warehouse') };

export { WarehousePage as default } from '@/presentation/projects/[projectId]/warehouse';
