import { type PropsWithChildren, Suspense } from 'react';
import { PageLoader } from '@/shared/components/common';
import { PrivateShell } from '@/layout/PrivateShell';
import { SidebarProvider } from '@/layout/Sidebar/primitives/Sidebar';
import { TooltipProvider } from '@/ui/Base';

const PrivateLayout = ({ children }: PropsWithChildren) => (
    <TooltipProvider>
        <SidebarProvider
            style={{
                '--sidebar-width': 'calc(var(--spacing) * 72)',
                '--header-height': 'calc(var(--spacing) * 12)',
            }}
        >
            <Suspense fallback={<PageLoader />}>
                <PrivateShell>{children}</PrivateShell>
            </Suspense>
        </SidebarProvider>
    </TooltipProvider>
);

export default PrivateLayout;
