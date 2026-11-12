import { HOME_LABEL } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: HOME_LABEL };

export { DashboardPage as default } from '@/presentation/dashboard';
