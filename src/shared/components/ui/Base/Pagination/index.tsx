import type { ComponentProps } from 'react';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/ui/Base';
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react';

const Pagination = ({ className, ...props }: ComponentProps<'nav'>) => {
    return (
        <nav
            aria-label="Страницы"
            data-slot="pagination"
            className={cn('mx-auto flex w-full justify-center', className)}
            {...props}
        />
    );
};

const PaginationContent = ({ className, ...props }: ComponentProps<'ul'>) => {
    return (
        <ul
            data-slot="pagination-content"
            className={cn('flex items-center gap-1', className)}
            {...props}
        />
    );
};

const PaginationItem = ({ ...props }: ComponentProps<'li'>) => {
    return (
        <li
            data-slot="pagination-item"
            {...props}
        />
    );
};

interface PaginationLinkProps
    extends Pick<ComponentProps<typeof Button>, 'size'>,
        ComponentProps<'a'> {
    isActive?: boolean;
}

const PaginationLink = ({ className, isActive, size = 'icon', ...props }: PaginationLinkProps) => {
    return (
        <Button
            asChild
            variant={isActive ? 'outline' : 'ghost'}
            size={size}
            className={cn(className)}
        >
            <a
                aria-current={isActive ? 'page' : undefined}
                data-slot="pagination-link"
                data-active={isActive}
                {...props}
            />
        </Button>
    );
};

const PaginationPrevious = ({
    className,
    text = 'Назад',
    ...props
}: ComponentProps<typeof PaginationLink> & {
    text?: string;
}) => {
    return (
        <PaginationLink
            aria-label="Предыдущая страница"
            size="default"
            className={cn('pl-2!', className)}
            {...props}
        >
            <ChevronLeftIcon data-icon="inline-start" />
            <span className="hidden sm:block">{text}</span>
        </PaginationLink>
    );
};

const PaginationNext = ({
    className,
    text = 'Далее',
    ...props
}: ComponentProps<typeof PaginationLink> & {
    text?: string;
}) => {
    return (
        <PaginationLink
            aria-label="Следующая страница"
            size="default"
            className={cn('pr-2!', className)}
            {...props}
        >
            <span className="hidden sm:block">{text}</span>
            <ChevronRightIcon data-icon="inline-end" />
        </PaginationLink>
    );
};

const PaginationEllipsis = ({ className, ...props }: ComponentProps<'span'>) => {
    return (
        <span
            aria-hidden
            data-slot="pagination-ellipsis"
            className={cn(
                "flex size-9 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
                className,
            )}
            {...props}
        >
            <MoreHorizontalIcon />
            <span className="sr-only">Ещё страницы</span>
        </span>
    );
};

export {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
};
