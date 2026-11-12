import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('audit') };

export { AuditLogPage as default } from '@/presentation/audit';
