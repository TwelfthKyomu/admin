'use client';

import { MessageScrollerProvider } from '@/ui/Base';
import { ThreadBody, type ThreadBodyProps } from './Body';
import { ThreadEmpty } from './Empty';

interface ChatThreadProps extends Omit<ThreadBodyProps, 'rootMessageId'> {
    rootMessageId?: string;
}

export const ChatThread = ({ rootMessageId, ...props }: ChatThreadProps) => {
    if (!rootMessageId) return <ThreadEmpty />;

    return (
        <MessageScrollerProvider
            autoScroll
            defaultScrollPosition="end"
            scrollEdgeThreshold={160}
        >
            <ThreadBody
                rootMessageId={rootMessageId}
                {...props}
            />
        </MessageScrollerProvider>
    );
};
