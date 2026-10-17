'use client';

import { useEffect, useState } from 'react';
import { useStaticData } from '@/app/providers';
import { ROUTES } from '@/shared/constants';
import { fmtMoney } from '@/shared/format/money';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { segmentLabel } from '@/shared/labels/navigation';
import { groupedProjectTabs } from '@/shared/lib/projectTabs';
import { orderNumber } from '@/contexts/order/Order.types';
import { canInOrg } from '@/contexts/organizationMember/OrganizationMember.types';
import { useGlobalSearch } from '@/contexts/search';
import { navMain } from '@/layout/Sidebar/constants';
import { Button } from '@/ui/Base';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandShortcut,
} from '@/ui/Base/Command';
import { Dialog, DialogContent, DialogTitle } from '@/ui/Base/Modal/primitives';
import { FolderKanban, Package, Receipt, SearchIcon, UserRound } from 'lucide-react';
import { useRouter } from 'next/navigation';

function useHotkeyToggle(setOpen: (update: (open: boolean) => boolean) => void) {
    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key.toLowerCase() !== 'k' || !(event.metaKey || event.ctrlKey)) return;

            event.preventDefault();
            setOpen((open) => !open);
        };

        window.addEventListener('keydown', onKeyDown);

        return () => window.removeEventListener('keydown', onKeyDown);
    }, [setOpen]);
}

export const CommandMenu = () => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const router = useRouter();
    const { organization, projects = [], projectPermissions } = useStaticData();
    const debouncedSearch = useDebouncedValue(search);
    const { data: found, isFetching } = useGlobalSearch(open ? debouncedSearch : '');
    const projectName = (id: string) => projects.find((project) => project.id === id)?.name ?? '';

    useHotkeyToggle(setOpen);

    const go = (href: string) => {
        setOpen(false);
        setSearch('');
        router.push(href);
    };

    const withQuery = (href: string, query: string) =>
        `${href}?${new URLSearchParams({ q: query })}`;

    const sections = navMain.filter(
        (item) => !item.permission || canInOrg(organization.role, item.permission),
    );

    return (
        <>
            <Button
                variant="outline"
                size="sm"
                className="hidden gap-2 text-muted-foreground sm:inline-flex"
                onClick={() => setOpen(true)}
            >
                <SearchIcon />
                Переход
                <kbd className="rounded border px-1 font-sans text-[10px]">⌘K</kbd>
            </Button>
            <Dialog
                open={open}
                onOpenChange={(next) => {
                    setOpen(next);

                    if (!next) setSearch('');
                }}
            >
                <DialogContent
                    className="overflow-hidden p-0 sm:max-w-lg"
                    showCloseButton={false}
                >
                    <DialogTitle className="sr-only">Быстрый переход</DialogTitle>
                    <Command loop>
                        <CommandInput
                            value={search}
                            onValueChange={setSearch}
                            placeholder="Раздел, заказ, клиент или товар…"
                        />
                        <CommandList>
                            <CommandEmpty>
                                {isFetching ? 'Ищем…' : 'Ничего не найдено.'}
                            </CommandEmpty>
                            {found && found.orders.length > 0 && (
                                <CommandGroup
                                    forceMount
                                    heading="Заказы"
                                >
                                    {found.orders.map((order) => (
                                        <CommandItem
                                            forceMount
                                            key={order.id}
                                            value={`order:${order.id}`}
                                            onSelect={() =>
                                                go(
                                                    ROUTES.project(
                                                        order.projectId,
                                                        'orders',
                                                        order.id,
                                                    ),
                                                )
                                            }
                                        >
                                            <Receipt />
                                            <span className="font-mono text-xs">
                                                {orderNumber(order)}
                                            </span>
                                            {order.customerName ??
                                                order.customerPhone ??
                                                'Без имени'}
                                            <CommandShortcut>
                                                {fmtMoney(order.totalAmount, order.currency)}
                                            </CommandShortcut>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            {found && found.clients.length > 0 && (
                                <CommandGroup
                                    forceMount
                                    heading="Клиенты"
                                >
                                    {found.clients.map((client) => (
                                        <CommandItem
                                            forceMount
                                            key={client.id}
                                            value={`client:${client.id}`}
                                            onSelect={() =>
                                                go(
                                                    withQuery(
                                                        ROUTES.project(client.projectId, 'clients'),
                                                        client.phone ??
                                                            client.email ??
                                                            client.firstName,
                                                    ),
                                                )
                                            }
                                        >
                                            <UserRound />
                                            {[client.firstName, client.lastName]
                                                .filter(Boolean)
                                                .join(' ')}
                                            <CommandShortcut>
                                                {client.phone ?? projectName(client.projectId)}
                                            </CommandShortcut>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            {found && found.products.length > 0 && (
                                <CommandGroup
                                    forceMount
                                    heading="Товары и услуги"
                                >
                                    {found.products.map((product) => (
                                        <CommandItem
                                            forceMount
                                            key={product.id}
                                            value={`product:${product.id}`}
                                            onSelect={() =>
                                                go(
                                                    withQuery(
                                                        ROUTES.project(
                                                            product.projectId,
                                                            'products',
                                                        ),
                                                        product.sku,
                                                    ),
                                                )
                                            }
                                        >
                                            <Package />
                                            {product.name}
                                            <CommandShortcut>{product.sku}</CommandShortcut>
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            )}
                            <CommandGroup heading="Разделы">
                                {sections.map((item) => (
                                    <CommandItem
                                        key={item.href}
                                        value={item.label}
                                        onSelect={() => go(item.href)}
                                    >
                                        {item.icon}
                                        {item.label}
                                    </CommandItem>
                                ))}
                                <CommandItem
                                    value="Профиль"
                                    onSelect={() => go(ROUTES.profile)}
                                >
                                    <UserRound />
                                    Профиль
                                </CommandItem>
                            </CommandGroup>
                            {projects.map((project) => (
                                <CommandGroup
                                    key={project.id}
                                    heading={project.name}
                                >
                                    <CommandItem
                                        value={`${project.name} обзор`}
                                        onSelect={() => go(ROUTES.project(project.id))}
                                    >
                                        <FolderKanban />
                                        Обзор проекта
                                    </CommandItem>
                                    {groupedProjectTabs(
                                        projectPermissions[project.id] ?? [],
                                    ).flatMap(({ tabs }) =>
                                        tabs.map((tab) => (
                                            <CommandItem
                                                key={tab.value}
                                                value={`${project.name} ${segmentLabel(tab.value)}`}
                                                onSelect={() =>
                                                    go(ROUTES.project(project.id, tab.value))
                                                }
                                            >
                                                {segmentLabel(tab.value)}
                                                <CommandShortcut>{project.name}</CommandShortcut>
                                            </CommandItem>
                                        )),
                                    )}
                                </CommandGroup>
                            ))}
                        </CommandList>
                    </Command>
                </DialogContent>
            </Dialog>
        </>
    );
};
