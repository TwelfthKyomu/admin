import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('products') };

export { ProductsPage as default } from '@/presentation/projects/[projectId]/products';
