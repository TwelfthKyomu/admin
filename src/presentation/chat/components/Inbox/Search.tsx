import type { RefObject } from 'react';
import {
    Button,
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/ui/Base';
import { Plus, Search } from 'lucide-react';

interface InboxSearchProps {
    value: string;
    onChange: (value: string) => void;
    inputRef: RefObject<HTMLInputElement | null>;
    onStartDm: () => void;
}

export const InboxSearch = ({ value, onChange, inputRef, onStartDm }: InboxSearchProps) => (
    <div className="flex items-center gap-1.5">
        <InputGroup className="h-[34px] rounded-lg">
            <InputGroupAddon>
                <Search className="size-[15px]" />
            </InputGroupAddon>
            <InputGroupInput
                ref={inputRef}
                type="search"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') onChange('');
                }}
                placeholder="Поиск по диалогам и сообщениям"
                aria-label="Поиск по диалогам и сообщениям"
                className="text-[13px]"
            />
        </InputGroup>
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="size-[34px] shrink-0 rounded-lg"
                    onClick={onStartDm}
                    aria-label="Новый личный чат"
                >
                    <Plus className="size-4" />
                </Button>
            </TooltipTrigger>
            <TooltipContent>Новый личный чат</TooltipContent>
        </Tooltip>
    </div>
);
