'use client';

import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import type { Option } from '@/shared/types';
import { Button } from '@/ui/Base/Button';
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from '@/ui/Base/Command';
import {
    PopoverContent,
    Popover as PopoverRoot,
    PopoverTrigger,
} from '@/ui/Base/Popover/primitives';
import { CheckIcon, ChevronsUpDownIcon } from 'lucide-react';

interface ComboboxProps<TValue extends string> {
    options: ReadonlyArray<Option<TValue>>;
    value?: TValue;
    onValueChange?: (value: TValue) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    disabled?: boolean;
    id?: string;
    triggerClassName?: string;
}

export const Combobox = <TValue extends string = string>({
    options,
    value,
    onValueChange,
    placeholder = 'Выберите…',
    searchPlaceholder = 'Поиск…',
    emptyText = 'Ничего не найдено.',
    disabled,
    id,
    triggerClassName,
}: ComboboxProps<TValue>) => {
    const [open, setOpen] = useState(false);
    const selected = options.find((option) => option.value === value);

    return (
        <PopoverRoot
            open={open}
            onOpenChange={setOpen}
        >
            <PopoverTrigger asChild>
                <Button
                    id={id}
                    type="button"
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn(
                        'w-full justify-between font-normal',
                        !selected && 'text-muted-foreground',
                        triggerClassName,
                    )}
                >
                    <span className="truncate">{selected?.label ?? placeholder}</span>
                    <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent
                align="start"
                className="w-(--radix-popover-trigger-width) p-0"
            >
                <Command>
                    <CommandInput placeholder={searchPlaceholder} />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        {options.map((option) => (
                            <CommandItem
                                key={option.value}
                                value={option.value}
                                keywords={[option.label, ...(option.keywords ?? [])]}
                                disabled={option.disabled}
                                onSelect={(next) => {
                                    onValueChange?.(next as TValue);
                                    setOpen(false);
                                }}
                            >
                                <CheckIcon
                                    className={cn(
                                        'size-4 shrink-0',
                                        option.value === value ? 'opacity-100' : 'opacity-0',
                                    )}
                                />
                                <span className="truncate">{option.label}</span>
                            </CommandItem>
                        ))}
                    </CommandList>
                </Command>
            </PopoverContent>
        </PopoverRoot>
    );
};
