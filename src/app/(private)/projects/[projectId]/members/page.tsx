import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('members') };

export { MembersPage as default } from '@/presentation/projects/[projectId]/members';
