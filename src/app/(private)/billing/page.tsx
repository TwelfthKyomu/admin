import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('billing') };

export { BillingPage as default } from '@/presentation/billing';
