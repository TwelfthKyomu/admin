import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('users') };

export { UsersPage as default } from '@/presentation/users';
