'use client';

import { useRef } from 'react';
import { pluralRu } from '@/shared/format/plural';
import type { ChatMessageView } from '@/contexts/chat';
import { Button, InputGroup, InputGroupAddon } from '@/ui/Base';
import { ArrowRight, Paperclip, Pencil } from 'lucide-react';
import type { PendingAttachment } from '../../hooks/useChatComposer';
import { CHAT_FILE_ACCEPT } from '../../lib/attachments';
import { ATTACHMENT_ONLY_BODY, CHARS_PLURAL, DELETED_AUTHOR } from '../../lib/text';
import { ComposerBanner } from './Banner';
import { MessageInput } from './Input';
import { PendingAttachments } from './PendingAttachments';

interface ComposerProps {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    canSubmit: boolean;
    onTyping?: () => void;
    onEditLast: () => void;
    isPending: boolean;
    attachments: PendingAttachment[];
    onAddFiles: (files: File[]) => void;
    onRemoveAttachment: (key: string) => void;
    replyTo?: ChatMessageView;
    onCancelReply: () => void;
    editing?: ChatMessageView;
    onCancelEdit: () => void;
    placeholder: string;
}

export const Composer = ({
    value,
    onChange,
    onSubmit,
    canSubmit,
    onTyping,
    onEditLast,
    isPending,
    attachments,
    onAddFiles,
    onRemoveAttachment,
    replyTo,
    onCancelReply,
    editing,
    onCancelEdit,
    placeholder,
}: ComposerProps) => {
    const fileInput = useRef<HTMLInputElement>(null);

    const handleChange = (next: string) => {
        onChange(next);

        if (next.length > 0) onTyping?.();
    };

    let cancel: (() => void) | undefined;

    if (editing) cancel = onCancelEdit;
    else if (replyTo) cancel = onCancelReply;

    return (
        <footer className="shrink-0 border-t border-border bg-card/15 px-3.5 pt-2.5 pb-3">
            {editing ? (
                <ComposerBanner
                    icon={<Pencil className="mt-0.5 size-3.5 shrink-0 text-violet-300" />}
                    tone="edit"
                    title="Редактирование сообщения"
                    text={editing.body || ATTACHMENT_ONLY_BODY}
                    cancelLabel="Отменить редактирование"
                    onCancel={onCancelEdit}
                />
            ) : (
                replyTo && (
                    <ComposerBanner
                        tone="reply"
                        title={`Ответ · ${replyTo.authorName ?? DELETED_AUTHOR}`}
                        text={replyTo.body || ATTACHMENT_ONLY_BODY}
                        cancelLabel="Отменить ответ"
                        onCancel={onCancelReply}
                    />
                )
            )}

            {!editing && (
                <PendingAttachments
                    items={attachments}
                    onRemove={onRemoveAttachment}
                />
            )}

            <div className="flex items-end gap-2">
                <InputGroup className="h-auto min-w-0 flex-1 items-end rounded-xl py-1.5 pr-1.5 pl-2.5">
                    <MessageInput
                        value={value}
                        onChange={handleChange}
                        onSubmit={onSubmit}
                        onCancel={cancel}
                        onArrowUpOnEmpty={onEditLast}
                        onPasteFiles={editing ? undefined : onAddFiles}
                        placeholder={editing ? 'Измените текст сообщения' : placeholder}
                        label={editing ? 'Изменить сообщение' : 'Новое сообщение'}
                        autoFocus
                    />
                    {!editing && (
                        <InputGroupAddon
                            align="inline-end"
                            className="py-0 pr-0"
                        >
                            <input
                                ref={fileInput}
                                type="file"
                                multiple
                                accept={CHAT_FILE_ACCEPT}
                                className="hidden"
                                tabIndex={-1}
                                onChange={(event) => {
                                    onAddFiles([...(event.target.files ?? [])]);
                                    event.target.value = '';
                                }}
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                className="size-[30px] rounded-lg text-muted-foreground"
                                onClick={() => fileInput.current?.click()}
                                disabled={isPending}
                                aria-label="Прикрепить файл"
                                title="Прикрепить файл"
                            >
                                <Paperclip className="size-4" />
                            </Button>
                        </InputGroupAddon>
                    )}
                </InputGroup>
                <Button
                    type="button"
                    onClick={onSubmit}
                    disabled={!canSubmit}
                    className="h-[42px] shrink-0 gap-[7px] rounded-xl px-4 text-[13.5px]"
                >
                    {editing ? 'Сохранить' : 'Отправить'}
                    <ArrowRight className="size-[15px]" />
                </Button>
            </div>

            <div className="mt-[7px] flex items-center gap-2.5 text-[11px] leading-none text-muted-foreground">
                <span className="truncate">
                    {editing
                        ? 'Enter — сохранить изменения · Esc — отменить правку'
                        : 'Enter — отправить · Shift+Enter — новая строка · Esc — сбросить'}
                </span>
                <span className="flex-1" />
                <span className="shrink-0 font-mono">
                    {value.length} {pluralRu(value.length, CHARS_PLURAL)}
                </span>
            </div>
        </footer>
    );
};
