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
import { useTranslations } from 'next-intl';

export const Slug = () => {
    const t = useTranslations('menu');
    const { projects } = useStaticData();
    const projectName = (segment: string) => projects?.find((item) => item.id === segment)?.name;

    const pathname = usePathname();
    const segments = pathname.split('/').filter(Boolean);

    const items = [
        { label: t('home'), href: '/' },
        ...segments.map((segment, index) => ({
            label:
                projectName(segment) ??
                (segments[index - 1] === 'orders' ? t('order') : t(segment)),
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
