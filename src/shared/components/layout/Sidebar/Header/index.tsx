import { ROUTES } from '@/shared/constants';
import { CommandMenu } from '@/layout/CommandMenu';
import { SidebarTrigger } from '@/layout/Sidebar/primitives/Sidebar';
import { Separator } from '@/ui/Base';
import Link from 'next/link';
import { Slug } from '../Slug';

export const Header = () => (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear">
        <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6 lg:items-center">
            <SidebarTrigger className="-ml-1" />
            <Separator
                orientation="vertical"
                className="mx-2"
            />
            <Slug />
            <div className="ml-auto flex shrink-0 items-center gap-2">
                <CommandMenu />
                <Link
                    href={ROUTES.terms}
                    className="shrink-0 rounded-md border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                >
                    Демо · тестовые данные
                </Link>
            </div>
        </div>
    </header>
);
