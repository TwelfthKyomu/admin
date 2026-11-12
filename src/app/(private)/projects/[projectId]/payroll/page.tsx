import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('payroll') };

export { PayrollPage as default } from '@/presentation/projects/[projectId]/payroll';
