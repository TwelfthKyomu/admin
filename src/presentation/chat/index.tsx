'use client';

import { QueryBoundary } from '@/shared/components/common';
import { ChatAside } from './components/Aside';
import { ChatCard } from './components/Card';
import { Inbox } from './components/Inbox';
import { ChatPane } from './components/Pane';
import { ChatThread } from './components/Thread';
import { useChatPage } from './hooks/useChatPage';
import { describeConversation } from './lib/conversation';

export const ChatPage = () => {
    const page = useChatPage();

    return (
        <QueryBoundary
            query={page.channels}
            isEmpty={(channels) => channels === null}
            errorTitle="Не удалось загрузить чат"
        >
            {(channels) => {
                const conversation = describeConversation(
                    page.target,
                    page.organizationName,
                    channels,
                    page.contacts,
                );

                return (
                    <div className="@container/chat relative flex min-h-0 flex-1 overflow-hidden rounded-lg border border-border bg-background">
                        <Inbox
                            organizationId={page.organizationId}
                            organizationName={page.organizationName}
                            channels={channels}
                            viewerId={page.viewer.id}
                            activeScope={page.scope}
                            open={page.listOpen}
                            onSelect={page.setTarget}
                            onSelectHit={page.openSearchHit}
                            onStartDm={page.openStartDm}
                        />

                        <ChatPane
                            key={page.scope}
                            organizationId={page.organizationId}
                            channels={channels}
                            conversation={conversation}
                            target={page.target}
                            scope={page.scope}
                            viewer={page.viewer}
                            typists={page.typists}
                            hidden={page.listOpen}
                            onTyping={page.notifyTyping}
                            onOpenThread={page.openThread}
                            onOpenProfile={page.openProfile}
                            onToggleCard={page.toggleCard}
                            onBack={page.openList}
                            focusMessageId={page.focusMessageId}
                            onFocusHandled={page.clearFocusMessage}
                        />

                        <ChatAside
                            panel={page.panel}
                            onSelectTab={page.selectAsideTab}
                            onClose={page.closePanel}
                        >
                            {page.panel?.kind === 'thread' ? (
                                <ChatThread
                                    key={`${page.scope}#${page.panel.messageId}`}
                                    organizationId={page.organizationId}
                                    target={page.target}
                                    scope={page.scope}
                                    rootMessageId={page.panel.messageId}
                                    viewer={page.viewer}
                                    canModerate={channels.canManage}
                                />
                            ) : (
                                <ChatCard
                                    target={page.target}
                                    scope={page.scope}
                                    conversation={conversation}
                                    profileUserId={page.panel?.userId}
                                    contacts={page.contacts}
                                    contactsPending={page.contactsPending}
                                    viewerId={page.viewer.id}
                                    onOpenDirectChat={page.openDirectChat}
                                />
                            )}
                        </ChatAside>
                    </div>
                );
            }}
        </QueryBoundary>
    );
};
