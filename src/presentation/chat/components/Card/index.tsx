'use client';

import type { ChatContactView, ChatTarget } from '@/contexts/chat';
import { Spinner } from '@/ui/Base';
import { useChatCard } from '../../hooks/useChatCard';
import type { ChatConversation } from '../../lib/conversation';
import { CardChannel } from './Channel';
import { CardFiles } from './Files';
import { CardLinks } from './Links';
import { CardMedia } from './Media';
import { CardPerson } from './Person';
import { CardSection } from './Section';

interface ChatCardProps {
    target: ChatTarget;
    scope: string;
    conversation: ChatConversation;
    profileUserId?: string;
    contacts: ChatContactView[];
    contactsPending: boolean;
    viewerId: string;
    onOpenDirectChat: (userId: string) => void;
}

export const ChatCard = ({
    target,
    scope,
    conversation,
    profileUserId,
    contacts,
    contactsPending,
    viewerId,
    onOpenDirectChat,
}: ChatCardProps) => {
    const card = useChatCard({ target, scope, conversation, profileUserId, contacts });
    const personId = card.personId;

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-3 py-3.5">
            {personId ? (
                <CardPerson
                    person={card.person}
                    isPending={contactsPending}
                    canWrite={personId !== viewerId && personId !== conversation.userId}
                    onWrite={() => onOpenDirectChat(personId)}
                />
            ) : (
                <CardChannel
                    conversation={conversation}
                    mediaCount={card.media.length}
                    filesCount={card.files.length}
                    linksCount={card.links.length}
                />
            )}

            {card.isPending ? (
                <div className="flex justify-center py-6">
                    <Spinner />
                </div>
            ) : (
                <>
                    <CardSection
                        title="Медиа"
                        count={card.media.length}
                    >
                        <CardMedia
                            items={card.media}
                            onBroken={card.markBroken}
                        />
                    </CardSection>
                    <CardSection
                        title="Файлы"
                        count={card.files.length}
                    >
                        <CardFiles items={card.files} />
                    </CardSection>
                    <CardSection
                        title="Ссылки"
                        count={card.links.length}
                    >
                        <CardLinks items={card.links} />
                    </CardSection>
                </>
            )}
        </div>
    );
};
