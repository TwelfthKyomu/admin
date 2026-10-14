import { fmtDateShort, fmtTime } from '@/shared/format/date';
import { matchesSearch } from '@/shared/lib/search';
import type { Option } from '@/shared/types';
import {
    type ChatChannelsView,
    type ChatLastMessageView,
    type ChatTarget,
    chatScopeKey,
} from '@/contexts/chat';
import { isSameDay } from 'date-fns';
import { channelInitials } from './avatar';
import { ATTACHMENT_ONLY_BODY } from './text';

const INBOX_FOLDER_VALUES = ['all', 'unread', 'channels', 'direct'] as const;

export type InboxFolder = (typeof INBOX_FOLDER_VALUES)[number];

const INBOX_FOLDER_LABEL: Record<InboxFolder, string> = {
    all: 'Все',
    unread: 'Непрочитанные',
    channels: 'Каналы',
    direct: 'Личные',
};

export const INBOX_FOLDER_OPTIONS: Option<InboxFolder>[] =
    INBOX_FOLDER_VALUES.map((value) => ({
        value,
        label: INBOX_FOLDER_LABEL[value],
    }));

export interface InboxRow {
    scope: string;
    target: ChatTarget;
    title: string;
    initials: string;
    image?: string;
    userId?: string;
    unread: number;
    lastAt?: Date;
    preview: string;
    hasDraft: boolean;
}

interface InboxSource {
    organizationId: string;
    organizationName: string;
    channels: ChatChannelsView;
    viewerId: string;
    activeScope: string;
    draftOf: (scope: string) => string;
}

function lastMessagePreview(
    last: ChatLastMessageView | undefined,
    viewerId: string,
    isDirect: boolean,
): string {
    if (!last) return 'Сообщений пока нет';

    const body = last.body || ATTACHMENT_ONLY_BODY;

    if (last.authorUserId === viewerId) return `Вы: ${body}`;
    if (isDirect || !last.authorName) return body;

    return `${last.authorName.split(' ')[0]}: ${body}`;
}

function inboxRow(
    source: InboxSource,
    target: ChatTarget,
    channel: Pick<InboxRow, 'title' | 'initials' | 'image' | 'userId'>,
): InboxRow {
    const scope = chatScopeKey(source.organizationId, target);
    const last = source.channels.lastMessages[scope];

    const draft =
        scope === source.activeScope ? '' : source.draftOf(scope).trim();

    return {
        ...channel,
        scope,
        target,
        unread: source.channels.unread[scope] ?? 0,
        lastAt: last?.createdAt,
        preview: draft
            ? `Черновик: ${draft}`
            : lastMessagePreview(
                  last,
                  source.viewerId,
                  target.kind === 'direct',
              ),
        hasDraft: draft.length > 0,
    };
}

export function buildInboxRows(source: InboxSource): InboxRow[] {
    const { channels, organizationName } = source;

    const rows = [
        inboxRow(
            source,
            { kind: 'organization' },
            {
                title: `# ${organizationName}`,
                initials: channelInitials(organizationName),
            },
        ),
        ...channels.projects.map((project) =>
            inboxRow(
                source,
                { kind: 'project', projectId: project.id },
                {
                    title: `# ${project.name}`,
                    initials: channelInitials(project.name),
                },
            ),
        ),
        ...channels.directs.map((direct) =>
            inboxRow(
                source,
                { kind: 'direct', channelId: direct.id },
                {
                    title: direct.otherUser.name,
                    initials: '',
                    image: direct.otherUser.image,
                    userId: direct.otherUser.id,
                },
            ),
        ),
    ];

    return rows.toSorted(
        (a, b) => (b.lastAt?.getTime() ?? 0) - (a.lastAt?.getTime() ?? 0),
    );
}

function inFolder(row: InboxRow, folder: InboxFolder): boolean {
    if (folder === 'unread') return row.unread > 0;
    if (folder === 'channels') return row.target.kind !== 'direct';
    if (folder === 'direct') return row.target.kind === 'direct';

    return true;
}

export function filterInboxRows(
    rows: InboxRow[],
    folder: InboxFolder,
    query: string,
    hitScopes: ReadonlySet<string>,
): InboxRow[] {
    return rows.filter(
        (row) =>
            inFolder(row, folder) &&
            (matchesSearch(query, row.title) || hitScopes.has(row.scope)),
    );
}

export function countInboxFolders(
    rows: InboxRow[],
): Record<InboxFolder, number> {
    return {
        all: rows.length,
        unread: rows.filter((row) => inFolder(row, 'unread')).length,
        channels: rows.filter((row) => inFolder(row, 'channels')).length,
        direct: rows.filter((row) => inFolder(row, 'direct')).length,
    };
}

export function inboxTime(date?: Date): string {
    if (!date) return '';

    const value = new Date(date);

    return isSameDay(value, new Date()) ? fmtTime(value) : fmtDateShort(value);
}
