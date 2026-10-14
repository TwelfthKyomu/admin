'use client';

import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Tabs as TabsPrimitive } from 'radix-ui';

const tabsListVariants = cva(
    'group/tabs-list inline-flex w-fit items-center justify-center rounded-lg p-[3px] text-muted-foreground group-data-[orientation=horizontal]/tabs:h-9 group-data-[orientation=vertical]/tabs:h-fit group-data-[orientation=vertical]/tabs:flex-col data-[variant=line]:rounded-none',
    {
        variants: {
            variant: {
                default: 'bg-muted',
                line: 'gap-1 bg-transparent',
                pill: 'gap-1 bg-transparent',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export type TabItem<TValue extends string = string> = {
    value: TValue;
    label: ReactNode | string;
    content?: ReactNode;
    icon?: ReactNode;
    disabled?: boolean;
};

type TabsRootProps = ComponentProps<typeof TabsPrimitive.Root>;

type TabsProps<TValue extends string> = Omit<
    TabsRootProps,
    'value' | 'defaultValue' | 'onValueChange'
> &
    VariantProps<typeof tabsListVariants> & {
        items: ReadonlyArray<TabItem<TValue>>;
        value?: TValue;
        defaultValue?: TValue;
        onValueChange?: (value: TValue) => void;
        contentClassName?: string;
        triggerClassName?: string;
        listClassName?: string;
    };

export const Tabs = <TValue extends string = string>({
    items,
    className,
    orientation = 'horizontal',
    variant = 'default',
    contentClassName,
    triggerClassName,
    listClassName,
    value,
    defaultValue,
    onValueChange,
    ...props
}: TabsProps<TValue>) => {
    return (
        <TabsPrimitive.Root
            data-slot="tabs"
            className={cn(
                'group/tabs flex gap-2 data-[orientation=horizontal]:flex-col',
                className,
            )}
            orientation={orientation}
            value={value}
            defaultValue={defaultValue}
            onValueChange={onValueChange ? (next) => onValueChange(next as TValue) : undefined}
            {...props}
        >
            <TabsPrimitive.List
                data-slot="tabs-list"
                data-variant={variant}
                className={cn(tabsListVariants({ variant }), listClassName)}
            >
                {items.map((item) => (
                    <TabsPrimitive.Trigger
                        key={item.value}
                        value={item.value}
                        disabled={item.disabled}
                        data-slot="tabs-trigger"
                        className={cn(
                            "relative inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap text-foreground/60 transition-all group-data-[orientation=vertical]/tabs:w-full group-data-[orientation=vertical]/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 dark:text-muted-foreground dark:hover:text-foreground group-data-[variant=default]/tabs-list:data-[state=active]:shadow-sm group-data-[variant=line]/tabs-list:data-[state=active]:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
                            'group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:border-transparent dark:group-data-[variant=line]/tabs-list:data-[state=active]:bg-transparent',
                            'group-data-[variant=pill]/tabs-list:rounded-full group-data-[variant=pill]/tabs-list:data-[state=active]:bg-primary group-data-[variant=pill]/tabs-list:data-[state=active]:text-primary-foreground group-data-[variant=pill]/tabs-list:data-[state=active]:shadow-none',
                            'dark:group-data-[variant=pill]/tabs-list:data-[state=active]:bg-primary dark:group-data-[variant=pill]/tabs-list:data-[state=active]:text-primary-foreground dark:group-data-[variant=pill]/tabs-list:data-[state=active]:border-transparent',
                            'group-data-[variant=default]/tabs-list:data-[state=active]:bg-background group-data-[variant=default]/tabs-list:data-[state=active]:text-foreground dark:group-data-[variant=default]/tabs-list:data-[state=active]:border-input dark:group-data-[variant=default]/tabs-list:data-[state=active]:bg-input/30 dark:group-data-[variant=default]/tabs-list:data-[state=active]:text-foreground',
                            'after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-[orientation=horizontal]/tabs:after:inset-x-0 group-data-[orientation=horizontal]/tabs:after:-bottom-1.25 group-data-[orientation=horizontal]/tabs:after:h-0.5 group-data-[orientation=vertical]/tabs:after:inset-y-0 group-data-[orientation=vertical]/tabs:after:-right-1 group-data-[orientation=vertical]/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-[state=active]:after:opacity-100',
                            triggerClassName,
                        )}
                    >
                        {item.icon}
                        {item.label}
                    </TabsPrimitive.Trigger>
                ))}
            </TabsPrimitive.List>

            {items?.map(
                (item) =>
                    item.content && (
                        <TabsPrimitive.Content
                            key={item.value}
                            value={item.value}
                            data-slot="tabs-content"
                            className={cn('flex-1 text-sm outline-none', contentClassName)}
                        >
                            {item.content}
                        </TabsPrimitive.Content>
                    ),
            )}
        </TabsPrimitive.Root>
    );
};
