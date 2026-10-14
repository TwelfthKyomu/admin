'use client';

import { useState } from 'react';
import { PageLoader, PersonCell } from '@/shared/components/common';
import { ORGANIZATION_ROLE_LABEL } from '@/shared/labels/team';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { matchesSearch } from '@/shared/lib/search';
import { chatChannelsScope, useChatContacts, useStartDirectChat } from '@/contexts/chat';
import { Input, Modal } from '@/ui/Base';

interface StartDmModalProps {
    organizationId: string;
    onOpened: (channelId: string) => void;
}

export const DirectChatStartModal = ({ organizationId, onOpened }: StartDmModalProps) => {
    const close = useModalClose();
    const [search, setSearch] = useState('');
    const contacts = useChatContacts(organizationId, true);
    const { mutateAsync, isPending } = useStartDirectChat(chatChannelsScope(organizationId));

    const visible = (contacts.data ?? []).filter((contact) =>
        matchesSearch(search, contact.name, contact.email),
    );

    const pick = async (userId: string) => {
        if (isPending) return;

        const { success, response } = await runAction(mutateAsync({ otherUserId: userId }));
        const channelId = response?.data?.channelId;

        if (success && channelId) {
            close();
            onOpened(channelId);
        }
    };

    return (
        <Modal
            onClose={close}
            busy={isPending}
            title="Новое личное сообщение"
            description="Выберите участника организации."
            className="max-w-md"
        >
            <div className="grid gap-3">
                <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Поиск по имени или email"
                    autoFocus
                />

                <div className="max-h-72 overflow-y-auto grid gap-0.5 -mx-1">
                    {contacts.isPending && <PageLoader className="py-6" />}
                    {visible.map((contact) => (
                        <button
                            key={contact.id}
                            type="button"
                            disabled={isPending}
                            onClick={() => void pick(contact.id)}
                            className="flex items-center gap-3 rounded-md px-2 py-1.5 text-left hover:bg-muted disabled:opacity-50"
                        >
                            <PersonCell
                                name={contact.name}
                                image={contact.image}
                                caption={contact.email}
                            />
                            <span className="ml-auto text-[11px] text-muted-foreground">
                                {ORGANIZATION_ROLE_LABEL[contact.role]}
                            </span>
                        </button>
                    ))}
                    {!contacts.isPending && visible.length === 0 && (
                        <p className="py-6 text-center text-[13px] text-muted-foreground">
                            Никого не найдено.
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    );
};
