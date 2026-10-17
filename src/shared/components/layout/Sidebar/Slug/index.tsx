'use client';

import { Fragment } from 'react';
import { useStaticData } from '@/app/providers';
import { HOME_LABEL, ORDER_LABEL, segmentLabel } from '@/shared/labels/navigation';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/ui/Base';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const Slug = () => {
    const { projects } = useStaticData();
    const projectName = (segment: string) => projects?.find((item) => item.id === segment)?.name;

    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

    const items = [
        { label: HOME_LABEL, href: '/' },
        ...segments.map((segment, index) => ({
            label:
                projectName(segment) ??
                (segments[index - 1] === 'orders' ? ORDER_LABEL : segmentLabel(segment)),
            href: `/${segments.slice(0, index + 1).join('/')}`,
        })),
    ];

    if (items.length === 0) return null;

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <Fragment key={item.href}>
                            <BreadcrumbItem key={item.href}>
                                {isLast ? (
                                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                                ) : (
                                    <BreadcrumbLink asChild>
                                        <Link href={item.href}>{item.label}</Link>
                                    </BreadcrumbLink>
                                )}
                            </BreadcrumbItem>
                            {!isLast && <BreadcrumbSeparator />}
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
};
