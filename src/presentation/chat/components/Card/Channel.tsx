import type { ChatConversation } from '../../lib/conversation';
import { CardHero } from './Hero';
import { CardRows } from './Rows';
import { CardSection } from './Section';

interface CardChannelProps {
    conversation: ChatConversation;
    mediaCount: number;
    filesCount: number;
    linksCount: number;
}

export const CardChannel = ({
    conversation,
    mediaCount,
    filesCount,
    linksCount,
}: CardChannelProps) => (
    <>
        <CardHero
            name={conversation.title}
            caption={conversation.subtitle}
            initials={conversation.initials}
        />
        <CardSection title="Профиль">
            <CardRows
                rows={[
                    { label: 'Медиа', value: String(mediaCount) },
                    { label: 'Файлы', value: String(filesCount) },
                    { label: 'Ссылки', value: String(linksCount) },
                ]}
            />
        </CardSection>
    </>
);
