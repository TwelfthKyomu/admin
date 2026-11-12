'use client';

import { useEffect, useRef, useState } from 'react';
import { SEARCH_QUERY_MIN } from '@/shared/constants/default';
import { isLetterShortcut } from '@/shared/lib/hotkey';
import {
    type ChatChannelsView,
    chatScopeKey,
    useChatMessageSearch,
} from '@/contexts/chat';
import {
    buildInboxRows,
    countInboxFolders,
    filterInboxRows,
    type InboxFolder,
} from '../lib/inbox';
import { useChatDrafts } from './useChatDrafts';

interface UseInboxOptions {
    organizationId: string;
    organizationName: string;
    channels: ChatChannelsView;
    viewerId: string;
    activeScope: string;
}

export function useInbox({
    organizationId,
    organizationName,
    channels,
    viewerId,
    activeScope,
}: UseInboxOptions) {
    const [folder, setFolder] = useState<InboxFolder>('all');
    const [query, setQuery] = useState('');
    const searchRef = useRef<HTMLInputElement>(null);

    const draftOf = useChatDrafts(viewerId);
    const search = useChatMessageSearch(organizationId, query);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (!isLetterShortcut(event, 'k')) return;

            event.preventDefault();
            searchRef.current?.focus();
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    const searching = query.trim().length >= SEARCH_QUERY_MIN;
    const hits = searching ? (search.data ?? []) : [];

    const hitScopes = new Set(
        hits.map((hit) => chatScopeKey(organizationId, hit.target)),
    );

    const rows = buildInboxRows({
        organizationId,
        organizationName,
        channels,
        viewerId,
        activeScope,
        draftOf,
    });

    return {
        folder,
        setFolder,
        query,
        setQuery,
        searchRef,
        rows: filterInboxRows(rows, folder, query, hitScopes),
        counts: countInboxFolders(rows),
        titleOf: (scope: string) =>
            rows.find((row) => row.scope === scope)?.title ?? '',
        searching,
        hits,
        hitsPending: search.isFetching,
    };
}
