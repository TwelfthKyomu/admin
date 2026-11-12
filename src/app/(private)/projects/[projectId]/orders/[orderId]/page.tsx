import { ORDER_LABEL } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: ORDER_LABEL };

export { OrderDetailPage as default } from '@/presentation/projects/[projectId]/orders/[orderId]';
