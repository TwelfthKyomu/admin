import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('orders') };

export { OrdersPage as default } from '@/presentation/projects/[projectId]/orders';
