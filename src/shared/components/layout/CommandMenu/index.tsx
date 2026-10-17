'use client';

import { useEffect, useState } from 'react';
import { useStaticData } from '@/app/providers';
import { ROUTES } from '@/shared/constants';
import { segmentLabel } from '@/shared/labels/navigation';
import { groupedProjectTabs } from '@/shared/lib/projectTabs';
import { canInOrg } from '@/contexts/organizationMember/OrganizationMember.types';
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
import { FolderKanban, SearchIcon, UserRound } from 'lucide-react';
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
    const router = useRouter();
    const { organization, projects = [], projectPermissions } = useStaticData();

    useHotkeyToggle(setOpen);

    const go = (href: string) => {
        setOpen(false);
        router.push(href);
    };

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
                onOpenChange={setOpen}
            >
                <DialogContent
                    className="overflow-hidden p-0"
                    showCloseButton={false}
                >
                    <DialogTitle className="sr-only">Быстрый переход</DialogTitle>
                    <Command loop>
                        <CommandInput placeholder="Раздел, проект или вкладка…" />
                        <CommandList>
                            <CommandEmpty>Ничего не найдено.</CommandEmpty>
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
