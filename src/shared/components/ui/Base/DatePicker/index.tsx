'use client';

import { type ComponentProps, useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button, Calendar } from '@/ui/Base';
import { CalendarIcon } from 'lucide-react';
import { Popover as PopoverPrimitive } from 'radix-ui';

type DatePickerVariant = NonNullable<ComponentProps<typeof Button>['variant']>;

const CALENDAR_VARIANT_CLASS: Record<DatePickerVariant, string> = {
    default: 'bg-primary text-primary-foreground',
    outline:
        'border-border bg-background text-foreground shadow-xs dark:border-input dark:bg-input/30',
    secondary: 'bg-secondary text-secondary-foreground',
    ghost: 'bg-transparent text-foreground',
    destructive: 'bg-destructive/10 text-destructive dark:bg-destructive/20',
    link: 'bg-background text-foreground',
};

type DatePickerProps = Omit<ComponentProps<typeof Button>, 'value' | 'onChange'> & {
    value?: Date;
    onValueChange?: (date?: Date) => void;
    placeholder?: string;
    locale?: string;
    minDate?: Date;
    maxDate?: Date;
    calendarVariant?: DatePickerVariant;
    pickerClassName?: string;
};

const DatePicker = ({
    value,
    onValueChange,
    placeholder = 'Выберите дату',
    locale = 'ru-RU',
    minDate,
    maxDate,
    className,
    disabled,
    variant = 'outline',
    calendarVariant,
    pickerClassName,
    ...props
}: DatePickerProps) => {
    const [open, setOpen] = useState(false);
    const selected = isValidDate(value) ? value : undefined;

    const disabledDays = [
        minDate ? { before: minDate } : undefined,
        maxDate ? { after: maxDate } : undefined,
    ].filter((matcher) => matcher !== undefined);

    return (
        <PopoverPrimitive.Root
            open={open}
            onOpenChange={setOpen}
        >
            <PopoverPrimitive.Trigger asChild>
                <Button
                    type="button"
                    variant={variant}
                    disabled={disabled}
                    className={cn(
                        'w-full justify-start text-left font-normal',
                        !selected && 'text-muted-foreground',
                        className,
                    )}
                    {...props}
                >
                    <CalendarIcon className="mr-1 size-4" />
                    {selected ? formatDate(selected, locale) : placeholder}
                </Button>
            </PopoverPrimitive.Trigger>
            <PopoverPrimitive.Portal>
                <PopoverPrimitive.Content
                    sideOffset={4}
                    align="start"
                    className={cn(
                        'z-60 overflow-hidden rounded-xl bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10',
                        pickerClassName,
                    )}
                >
                    <Calendar
                        mode="single"
                        className={CALENDAR_VARIANT_CLASS[calendarVariant ?? variant ?? 'outline']}
                        selected={selected}
                        disabled={disabledDays}
                        onSelect={(next) => {
                            onValueChange?.(next);
                            setOpen(false);
                        }}
                    />
                </PopoverPrimitive.Content>
            </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
    );
};

function isValidDate(value?: Date): value is Date {
    return value instanceof Date && !Number.isNaN(value.getTime());
}

function formatDate(date: Date, locale: string): string {
    return new Intl.DateTimeFormat(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(date);
}

export { DatePicker };
