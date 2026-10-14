'use client';

import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';

const Table = ({ className, ...props }: ComponentProps<'table'>) => {
    return (
        <div
            data-slot="table-container"
            className="relative w-full overflow-x-auto"
        >
            <table
                data-slot="table"
                className={cn('w-full caption-bottom text-sm', className)}
                {...props}
            />
        </div>
    );
};

const TableHeader = ({ className, ...props }: ComponentProps<'thead'>) => {
    return (
        <thead
            data-slot="table-header"
            className={cn('[&_tr]:border-b', className)}
            {...props}
        />
    );
};

const TableBody = ({ className, ...props }: ComponentProps<'tbody'>) => {
    return (
        <tbody
            data-slot="table-body"
            className={cn('[&_tr:last-child]:border-0', className)}
            {...props}
        />
    );
};

const TableFooter = ({ className, ...props }: ComponentProps<'tfoot'>) => {
    return (
        <tfoot
            data-slot="table-footer"
            className={cn('border-t bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
            {...props}
        />
    );
};

const TableRow = ({ className, ...props }: ComponentProps<'tr'>) => {
    return (
        <tr
            data-slot="table-row"
            className={cn('border-b transition-colors data-[state=selected]:bg-muted', className)}
            {...props}
        />
    );
};

const TableHead = ({ className, ...props }: ComponentProps<'th'>) => {
    return (
        <th
            data-slot="table-head"
            className={cn(
                'h-10 px-2 text-left align-middle font-medium whitespace-nowrap text-foreground has-[[role=checkbox]]:pr-0',
                className,
            )}
            {...props}
        />
    );
};

const TableCell = ({ className, ...props }: ComponentProps<'td'>) => {
    return (
        <td
            data-slot="table-cell"
            className={cn(
                'p-2 align-middle whitespace-nowrap bg-white/5 border-r has-[[role=checkbox]]:pr-0',
                className,
            )}
            {...props}
        />
    );
};

const TableCaption = ({ className, ...props }: ComponentProps<'caption'>) => {
    return (
        <caption
            data-slot="table-caption"
            className={cn('mt-4 text-sm text-muted-foreground', className)}
            {...props}
        />
    );
};

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
