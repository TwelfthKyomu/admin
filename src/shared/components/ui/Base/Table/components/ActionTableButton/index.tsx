'use client';

import { Fragment, type ReactNode } from 'react';
import {
    Button,
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/ui/Base';
import { EllipsisVertical } from 'lucide-react';

export interface TableActionItem {
    key: string;
    label: string;
    icon?: ReactNode;
    separator?: boolean;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
    onSelect: () => void;
}

interface ActionTableButtonProps {
    items: TableActionItem[];
    align?: 'start' | 'end' | 'center';
    label?: string;
}

export const ActionTableButton = ({
    items,
    align = 'end',
    label = 'Действия',
}: ActionTableButtonProps) => {
    if (items.length === 0) return null;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-muted-foreground data-[state=open]:bg-muted"
                    onClick={(event) => event.stopPropagation()}
                    aria-label={label}
                >
                    <EllipsisVertical className="size-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                align={align}
                className="min-w-40"
            >
                {items.map((item) => (
                    <Fragment key={item.key}>
                        {item.separator && <DropdownMenuSeparator />}
                        <DropdownMenuItem
                            disabled={item.disabled}
                            variant={item.variant}
                            onClick={(event) => {
                                event.stopPropagation();
                                item.onSelect();
                            }}
                        >
                            {item.icon && <span>{item.icon}</span>}
                            {item.label}
                        </DropdownMenuItem>
                    </Fragment>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};
