'use client';

import { useState } from 'react';
import { useStaticData } from '@/app/providers';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';
import { canInOrg } from '@/contexts/organizationMember/OrganizationMember.types';
import { useGlobalSearch } from '@/contexts/search';
import { navMain } from '@/layout/Sidebar/constants';
import { useRouter } from 'next/navigation';
import { useHotkeyToggle } from './useHotkeyToggle';

export const useCommandMenu = () => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const router = useRouter();
    const { organization, projects = [], projectPermissions } = useStaticData();
    const debouncedSearch = useDebouncedValue(search);

    const { data: found, isFetching } = useGlobalSearch(
        open ? debouncedSearch : '',
    );

    useHotkeyToggle(setOpen);

    const go = (href: string) => {
        setOpen(false);
        setSearch('');
        router.push(href);
    };

    const onOpenChange = (next: boolean) => {
        setOpen(next);

        if (!next) setSearch('');
    };

    const sections = navMain.filter(
        (item) =>
            !item.permission || canInOrg(organization.role, item.permission),
    );

    return {
        open,
        setOpen,
        search,
        setSearch,
        found,
        isFetching,
        projects,
        projectPermissions,
        sections,
        go,
        onOpenChange,
    };
};
