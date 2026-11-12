import { useSyncExternalStore } from 'react';
import {
    isMobileViewport,
    isMobileViewportOnServer,
    subscribeMobileViewport,
} from '@/shared/lib/mobileViewport';

export const useIsMobile = (): boolean => {
    return useSyncExternalStore(
        subscribeMobileViewport,
        isMobileViewport,
        isMobileViewportOnServer,
    );
};
