'use client';

import { Button, InputGroup } from '@/ui/Base';
import { ArrowRight, Pencil } from 'lucide-react';
import type { ChatComposer } from '../../hooks/useChatComposer';
import { ATTACHMENT_ONLY_BODY } from '../../lib/text';
import { ComposerBanner } from '../Composer/Banner';
import { MessageInput } from '../Composer/Input';
import { PendingAttachments } from '../Composer/PendingAttachments';

interface ThreadComposerProps {
    composer: ChatComposer;
}

export const ThreadComposer = ({ composer }: ThreadComposerProps) => (
    <div className="shrink-0 border-t border-border px-3 pt-2.5 pb-3">
        {composer.editing && (
            <ComposerBanner
                icon={<Pencil className="mt-0.5 size-3.5 shrink-0 text-violet-300" />}
                tone="edit"
                title="Редактирование ответа"
                text={composer.editing.body || ATTACHMENT_ONLY_BODY}
                cancelLabel="Отменить редактирование"
                onCancel={composer.cancelEdit}
            />
        )}
        {!composer.editing && (
            <PendingAttachments
                items={composer.attachments}
                onRemove={composer.removeAttachment}
            />
        )}
        <div className="flex items-end gap-[7px]">
            <InputGroup className="h-auto min-w-0 flex-1 rounded-[10px] px-2.5 py-0.5">
                <MessageInput
                    value={composer.draft}
                    onChange={composer.changeDraft}
                    onSubmit={composer.submit}
                    onCancel={composer.editing ? composer.cancelEdit : undefined}
                    onArrowUpOnEmpty={composer.editLastOwnMessage}
                    onPasteFiles={composer.editing ? undefined : composer.addFiles}
                    placeholder="Ответить в треде"
                    label="Ответ в треде"
                    className="max-h-[120px] text-[12.5px] md:text-[12.5px]"
                />
            </InputGroup>
            <Button
                type="button"
                size="icon"
                className="rounded-[10px]"
                onClick={composer.submit}
                disabled={!composer.canSubmit}
                aria-label={composer.editing ? 'Сохранить' : 'Отправить'}
            >
                <ArrowRight className="size-[15px]" />
            </Button>
        </div>
    </div>
);
