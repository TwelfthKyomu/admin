import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('coupons') };

export { CouponsPage as default } from '@/presentation/projects/[projectId]/coupons';
