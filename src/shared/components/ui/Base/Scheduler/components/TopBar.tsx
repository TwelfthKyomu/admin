import type { ReactNode } from 'react';
import { Button, Item, ItemContent, ItemDescription, ItemHeader, Tabs } from '@/ui/Base';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/ui/Base/InputGroup';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { MODE_LABELS, MODES } from '../constants';
import { buildRangeLabel, shiftDate } from '../lib/time';
import type { SchedulerMode } from '../Scheduler.types';

interface TopBarProps {
    date: Date;
    onDateChange: (next: Date) => void;
    mode: SchedulerMode;
    onModeChange: (mode: SchedulerMode) => void;
    search: string;
    onSearchChange: (value: string) => void;
    matchedCount: number;
    actionsSlot?: ReactNode;
}

const MODE_OPTIONS = MODES.map((value) => ({ value, label: MODE_LABELS[value] }));

export const TopBar = ({
    date,
    onDateChange,
    mode,
    onModeChange,
    search,
    onSearchChange,
    matchedCount,
    actionsSlot,
}: TopBarProps) => {
    const range = buildRangeLabel(date, mode);

    return (
        <div className="flex items-center px-4 gap-3 shrink-0 bg-background">
            <div className="flex items-center gap-1">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDateChange(shiftDate(date, mode, -1))}
                    aria-label="Назад"
                >
                    <ChevronLeft size={16} />
                </Button>
                <Button
                    variant="outline"
                    onClick={() => onDateChange(new Date())}
                >
                    Сегодня
                </Button>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDateChange(shiftDate(date, mode, 1))}
                    aria-label="Вперёд"
                >
                    <ChevronRight size={16} />
                </Button>
            </div>

            <Item className="w-fit">
                <ItemContent>
                    <ItemHeader>{range.title}</ItemHeader>
                    <ItemDescription className="text-[11px] leading-tight truncate">
                        {range.sub}
                    </ItemDescription>
                </ItemContent>
            </Item>

            <Tabs
                items={MODE_OPTIONS}
                value={mode}
                onValueChange={onModeChange}
            />

            <InputGroup className="flex w-fit ml-auto">
                <InputGroupInput
                    placeholder="Поиск…"
                    value={search}
                    onChange={(event) => onSearchChange(event.target.value)}
                />
                <InputGroupAddon>
                    <Search />
                </InputGroupAddon>
                <InputGroupAddon align="inline-end">
                    <span className="tabular-nums">{matchedCount}</span>
                </InputGroupAddon>
            </InputGroup>

            {actionsSlot}
        </div>
    );
};
