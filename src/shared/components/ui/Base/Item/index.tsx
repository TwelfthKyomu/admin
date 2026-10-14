'use client';

import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';

const itemVariants = cva(
    'group/item flex w-full flex-wrap items-center rounded-md border text-sm transition-colors duration-100 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 [a]:transition-colors [a]:hover:bg-muted',
    {
        variants: {
            variant: {
                default: 'border-transparent',
                outline: 'border-border',
                muted: 'border-transparent bg-muted/50',
            },
            size: {
                default: 'gap-3.5 px-4 py-3.5',
                sm: 'gap-2.5 px-3 py-2.5',
                xs: 'gap-2 px-2.5 py-2 in-data-[slot=dropdown-menu-content]:p-0',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

const Item = ({
    className,
    variant = 'default',
    size = 'default',
    asChild = false,
    ...props
}: ComponentProps<'div'> &
    VariantProps<typeof itemVariants> & {
        asChild?: boolean;
    }) => {
    const Comp = asChild ? Slot.Root : 'div';

    return (
        <Comp
            data-slot="item"
            data-variant={variant}
            data-size={size}
            className={cn(itemVariants({ variant, size, className }))}
            {...props}
        />
    );
};

const ItemContent = ({ className, ...props }: ComponentProps<'div'>) => {
    return (
        <div
            data-slot="item-content"
            className={cn(
                'flex flex-1 flex-col gap-1 group-data-[size=xs]/item:gap-0 [&+[data-slot=item-content]]:flex-none',
                className,
            )}
            {...props}
        />
    );
};

const ItemTitle = ({ className, ...props }: ComponentProps<'div'>) => {
    return (
        <div
            data-slot="item-title"
            className={cn(
                'line-clamp-1 flex w-fit items-center gap-2 text-sm leading-snug font-medium underline-offset-4',
                className,
            )}
            {...props}
        />
    );
};

const ItemDescription = ({ className, ...props }: ComponentProps<'p'>) => {
    return (
        <p
            data-slot="item-description"
            className={cn(
                'line-clamp-2 text-left text-sm leading-normal font-normal text-muted-foreground group-data-[size=xs]/item:text-xs [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary',
                className,
            )}
            {...props}
        />
    );
};

const ItemActions = ({ className, ...props }: ComponentProps<'div'>) => {
    return (
        <div
            data-slot="item-actions"
            className={cn('flex items-center gap-2', className)}
            {...props}
        />
    );
};

const ItemHeader = ({ className, ...props }: ComponentProps<'div'>) => {
    return (
        <div
            data-slot="item-header"
            className={cn('flex basis-full items-center justify-between gap-2', className)}
            {...props}
        />
    );
};

export { Item, ItemActions, ItemContent, ItemDescription, ItemHeader, ItemTitle };
