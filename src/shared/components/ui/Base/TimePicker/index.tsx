'use client';

import type { ComponentProps } from 'react';
import { fmtTime } from '@/shared/format/date';
import { cn } from '@/shared/lib/utils';
import {
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/ui/Base';
import { eachMinuteOfInterval, endOfDay, startOfDay } from 'date-fns';
import { CheckIcon, ChevronDownIcon, ClockIcon } from 'lucide-react';

type TimePickerProps = Omit<ComponentProps<typeof Button>, 'value' | 'onChange'> & {
    value?: string;
    onValueChange?: (value: string) => void;
    placeholder?: string;
    minuteStep?: number;
};

const TimePicker = ({
    value = '',
    onValueChange,
    placeholder = 'Выберите время',
    minuteStep = 15,
    className,
    disabled,
    ...props
}: TimePickerProps) => {
    const day = new Date();

    const options = eachMinuteOfInterval(
        { start: startOfDay(day), end: endOfDay(day) },
        { step: minuteStep },
    ).map(fmtTime);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger
                asChild
                disabled={disabled}
            >
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    className={cn(
                        'w-full justify-between font-normal',
                        !value && 'text-muted-foreground',
                        className,
                    )}
                    {...props}
                >
                    <span className="inline-flex min-w-0 items-center gap-2">
                        <ClockIcon className="size-4 shrink-0" />
                        <span className="truncate font-mono tabular-nums">
                            {value || placeholder}
                        </span>
                    </span>
                    <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="z-[60] max-h-64 min-w-[var(--radix-dropdown-menu-trigger-width)]">
                {options.map((option) => (
                    <DropdownMenuItem
                        key={option}
                        onSelect={() => onValueChange?.(option)}
                    >
                        <span className="font-mono tabular-nums">{option}</span>
                        {option === value && <CheckIcon className="ml-auto size-4" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export { TimePicker };
