'use client';

import { useState } from 'react';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { matchesSearch } from '@/shared/lib/search';
import { useChatContacts, useStartDirectChat } from '@/contexts/chat';

export const useDirectChatStartModal = (
    organizationId: string,
    onOpened: (channelId: string) => void,
) => {
    const close = useModalClose();
    const [search, setSearch] = useState('');
    const contacts = useChatContacts(organizationId, true);
    const { mutateAsync, isPending } = useStartDirectChat();

    const visible = (contacts.data ?? []).filter((contact) =>
        matchesSearch(search, contact.name, contact.email),
    );

    const pick = async (userId: string) => {
        if (isPending) return;

        const { success, response } = await runAction(
            mutateAsync({ otherUserId: userId }),
        );

        const channelId = response?.data?.channelId;

        if (success && channelId) {
            close();
            onOpened(channelId);
        }
    };

    return { close, search, setSearch, contacts, isPending, visible, pick };
};
