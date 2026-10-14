import { pluralRu } from '@/shared/format/plural';
import { ORGANIZATION_ROLE_LABEL } from '@/shared/labels/team';
import type {
    ChatChannelsView,
    ChatContactView,
    ChatTarget,
} from '@/contexts/chat';
import { channelInitials } from './avatar';
import { MEMBERS_PLURAL } from './text';

export interface ChatConversation {
    title: string;
    subtitle: string;
    initials?: string;
    image?: string;
    userId?: string;
    direct: boolean;
}

export function describeConversation(
    target: ChatTarget,
    organizationName: string,
    channels: ChatChannelsView,
    contacts: ChatContactView[],
): ChatConversation {
    if (target.kind === 'direct') {
        const other = channels.directs.find(
            (direct) => direct.id === target.channelId,
        )?.otherUser;

        const contact = contacts.find(
            (candidate) => candidate.id === other?.id,
        );

        return {
            title: other?.name ?? 'Личный чат',
            subtitle: contact
                ? `${ORGANIZATION_ROLE_LABEL[contact.role]} · ${contact.email}`
                : 'Личные сообщения',
            image: other?.image,
            userId: other?.id,
            direct: true,
        };
    }

    if (target.kind === 'project') {
        const name =
            channels.projects.find((project) => project.id === target.projectId)
                ?.name ?? 'Проект';

        return {
            title: `# ${name}`,
            subtitle: 'Канал проекта',
            initials: channelInitials(name),
            direct: false,
        };
    }

    const members = contacts.length + 1;

    return {
        title: `# ${organizationName}`,
        subtitle: `Канал организации · ${members} ${pluralRu(members, MEMBERS_PLURAL)}`,
        initials: channelInitials(organizationName),
        direct: false,
    };
}

export function composerPlaceholder(conversation: ChatConversation): string {
    return conversation.direct
        ? `Сообщение для ${conversation.title}`
        : `Сообщение в ${conversation.title}`;
}
