'use client';

import { useState } from 'react';
import { useStaticData } from '@/app/providers';
import { runAction } from '@/shared/lib/action-result';
import { modal } from '@/shared/lib/modal';
import { useRealtimeSync } from '@/shared/realtime/scope';
import {
    type ChatSearchResultView,
    type ChatTarget,
    type ChatUserView,
    chatChannelsScope,
    chatScopeKey,
    useChatChannels,
    useChatContacts,
    useStartDirectChat,
} from '@/contexts/chat';
import { useQueryState } from 'nuqs';
import {
    type ChatPanel,
    ORGANIZATION_CHANNEL_PARAM,
    parseChatPanel,
    parseChatTarget,
    serializeChatPanel,
    serializeChatTarget,
} from '../lib/chatUrl';
import { DirectChatStartModal } from '../modal/DirectChatStartModal';
import { useChatTyping } from './useChatTyping';

export function useChatPage() {
    const { organization, user } = useStaticData();
    const organizationId = organization.id;

    const [channelParam, setChannelParam] = useQueryState('channel', {
        defaultValue: ORGANIZATION_CHANNEL_PARAM,
    });

    const [panelParam, setPanelParam] = useQueryState('panel', {
        defaultValue: '',
    });

    const [messageParam, setMessageParam] = useQueryState('message', {
        defaultValue: '',
    });

    const [listOpen, setListOpen] = useState(false);
    const [lastThreadId, setLastThreadId] = useState<string>();

    const target = parseChatTarget(channelParam);
    const panel = parseChatPanel(panelParam);
    const scope = chatScopeKey(organizationId, target);

    const setPanel = (next?: ChatPanel) => {
        void setPanelParam(serializeChatPanel(next));
    };

    const setTarget = (next: ChatTarget) => {
        void setChannelParam(serializeChatTarget(next));
        void setPanelParam('');
        void setMessageParam('');
        setLastThreadId(undefined);
        setListOpen(false);
    };

    const channels = useChatChannels(organizationId);
    const contacts = useChatContacts(organizationId, true);
    const typing = useChatTyping(scope, user.id);

    useRealtimeSync([chatChannelsScope(organizationId), scope], {
        onTyping: typing.handleTyping,
    });

    const startDm = useStartDirectChat(chatChannelsScope(organizationId));

    const openDirectChat = async (otherUserId: string) => {
        const { success, response } = await runAction(startDm.mutateAsync({ otherUserId }));
        const channelId = response?.data?.channelId;

        if (success && channelId) setTarget({ kind: 'direct', channelId });
    };

    const openStartDm = () => {
        void modal.open(
            <DirectChatStartModal
                organizationId={organizationId}
                onOpened={(channelId) => setTarget({ kind: 'direct', channelId })}
            />,
        );
    };

    const openThread = (messageId: string) => {
        setLastThreadId(messageId);
        setPanel({ kind: 'thread', messageId });
    };

    const openSearchHit = (hit: ChatSearchResultView) => {
        void setChannelParam(serializeChatTarget(hit.target));
        void setMessageParam(hit.threadRootId ? '' : hit.id);

        void setPanelParam(
            hit.threadRootId
                ? serializeChatPanel({ kind: 'thread', messageId: hit.threadRootId })
                : '',
        );

        setLastThreadId(hit.threadRootId ?? undefined);
        setListOpen(false);
    };

    const selectAsideTab = (tab: ChatPanel['kind']) => {
        setPanel(tab === 'thread' ? { kind: 'thread', messageId: lastThreadId } : { kind: 'card' });
    };

    const viewer: ChatUserView = {
        id: user.id,
        name: user.name,
        image: user.image ?? undefined,
    };

    return {
        organizationId,
        organizationName: organization.name,
        viewer,
        target,
        scope,
        setTarget,
        channels,
        contacts: contacts.data ?? [],
        contactsPending: contacts.isPending,
        typists: typing.typists,
        notifyTyping: typing.notifyTyping,
        openStartDm,
        openDirectChat,
        openSearchHit,
        focusMessageId: messageParam || undefined,
        clearFocusMessage: () => void setMessageParam(''),
        panel,
        openThread,
        openProfile: (userId: string) => setPanel({ kind: 'card', userId }),
        toggleCard: () => setPanel(panel ? undefined : { kind: 'card' }),
        selectAsideTab,
        closePanel: () => setPanel(),
        listOpen,
        openList: () => setListOpen(true),
    };
}
