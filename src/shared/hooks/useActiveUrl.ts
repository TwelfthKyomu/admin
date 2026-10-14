'use client';

import { isActiveUrl } from '@/shared/format/url';
import { usePathname } from 'next/navigation';

export function useActiveUrl() {
    const pathname = usePathname();

    return (href: string, exact = false) => isActiveUrl(pathname, href, exact);
}
