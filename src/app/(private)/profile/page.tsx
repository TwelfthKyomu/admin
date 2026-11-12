import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('profile') };

export { ProfilePage as default } from '@/presentation/profile';
