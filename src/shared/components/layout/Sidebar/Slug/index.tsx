'use client';

import { Fragment } from 'react';
import { useStaticData } from '@/app/providers';
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
import { breadcrumbItems } from './breadcrumbs';

export const Slug = () => {
    const { projects } = useStaticData();
    const items = breadcrumbItems(usePathname(), projects ?? []);

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
