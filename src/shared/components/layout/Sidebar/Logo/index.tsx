'use client';

import { cn } from '@/shared/lib/utils';
import { env } from '@/env';
import { Separator } from '@/ui/Base';
import Link from 'next/link';
import { Icon } from './Icon';

export const Logo = () => (
    <Link
        href="/"
        className={cn(
            '-m-1 inline-flex items-center justify-start gap-2.5 px-3 py-1.5 pl-1.5 rounded-[10px] border border-white/10 bg-transparent h-10',
        )}
    >
        <div className="flex size-7">
            <Icon />
        </div>
        <div className="flex flex-1 text-left gap-2.5 items-center leading-tight truncate">
            <h4 className="truncate whitespace-nowrap">Flowsy</h4>
            <Separator
                orientation="vertical"
                className="min-w-0"
            />
            <span className="text-[11px] text-white/30 font-semibold">
                Admin v{env.NEXT_PUBLIC_APP_VERSION}
            </span>
        </div>
    </Link>
);
