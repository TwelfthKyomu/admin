'use client';

import { useSyncExternalStore } from 'react';
import {
    draftsVersion,
    readDraft,
    serverDraftsVersion,
    subscribeDrafts,
} from '../lib/drafts';

export const useChatDrafts = (viewerId: string) => {
    useSyncExternalStore(subscribeDrafts, draftsVersion, serverDraftsVersion);

    return (scope: string) => readDraft(`${viewerId}:${scope}`);
};
