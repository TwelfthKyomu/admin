import type { ReactNode } from 'react';
import { Item, ItemActions, ItemContent, ItemDescription, ItemHeader } from '@/ui/Base';

interface ColumnHeaderProps {
    title: string;
    sub?: string;
    actions?: ReactNode;
}

export const ColumnHeader = ({ title, sub, actions }: ColumnHeaderProps) => (
    <Item
        size="xs"
        className="min-w-0 px-0"
    >
        <ItemContent>
            <ItemHeader className="truncate text-[12px] font-medium">{title}</ItemHeader>
            {sub && (
                <ItemDescription className="truncate text-[10px] leading-tight">
                    {sub}
                </ItemDescription>
            )}
        </ItemContent>
        {actions && <ItemActions className="my-auto">{actions}</ItemActions>}
    </Item>
);
