'use client';

import { MessageScrollerProvider } from '@/ui/Base';
import { type ChatPaneProps, PaneBody } from './Body';

export const ChatPane = (props: ChatPaneProps) => (
    <MessageScrollerProvider
        autoScroll
        defaultScrollPosition="end"
        scrollEdgeThreshold={160}
    >
        <PaneBody {...props} />
    </MessageScrollerProvider>
);
