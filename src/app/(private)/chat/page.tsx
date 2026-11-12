import { segmentLabel } from '@/shared/labels/navigation';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: segmentLabel('chat') };

export { ChatPage as default } from '@/presentation/chat';
