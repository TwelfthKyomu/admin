'use client';

import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button, type TabItem, Tabs } from '@/ui/Base';
import { X } from 'lucide-react';
import type { ChatPanel } from '../lib/chatUrl';

const ASIDE_TABS: TabItem<ChatPanel['kind']>[] = [
    { value: 'card', label: 'Карточка' },
    { value: 'thread', label: 'Тред' },
];

interface ChatAsideProps {
    panel?: ChatPanel;
    onSelectTab: (tab: ChatPanel['kind']) => void;
    onClose: () => void;
    children: ReactNode;
}

export const ChatAside = ({ panel, onSelectTab, onClose, children }: ChatAsideProps) => (
    <aside
        className={cn(
            'w-[312px] shrink-0 overflow-hidden border-l border-border bg-background',
            panel
                ? 'absolute inset-y-0 right-0 z-40 flex shadow-[-18px_0_44px_rgb(0_0_0/0.55)] @max-3xl/chat:w-full @6xl/chat:static @6xl/chat:shadow-none'
                : 'hidden @6xl/chat:flex',
        )}
    >
        <div className="flex min-w-0 flex-1 flex-col bg-card/40">
            <div className="flex shrink-0 items-center gap-0.5 border-b border-border px-3 py-2.5">
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="shrink-0 rounded-lg text-muted-foreground @6xl/chat:hidden"
                    onClick={onClose}
                    aria-label="Скрыть панель"
                    title="Скрыть панель"
                >
                    <X className="size-3.5" />
                </Button>
                <Tabs<ChatPanel['kind']>
                    items={ASIDE_TABS}
                    value={panel?.kind ?? 'card'}
                    onValueChange={onSelectTab}
                    className="flex-1"
                    listClassName="w-full"
                    triggerClassName="text-[12px]"
                />
            </div>
            {children}
        </div>
    </aside>
);
