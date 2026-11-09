'use client';

import { useSyncExternalStore } from 'react';
import { useProjectSetup } from '@/contexts/project';
import {
    hideSetup,
    readHiddenSetups,
    subscribeSetupHidden,
} from '../lib/setup';

export function useSetupChecklist() {
    const { data = [] } = useProjectSetup();

    const hidden = useSyncExternalStore(
        subscribeSetupHidden,
        readHiddenSetups,
        () => null,
    );

    const setups =
        hidden === null
            ? []
            : data.filter(
                  (setup) => !hidden.split(',').includes(setup.projectId),
              );

    return { setups, hide: hideSetup };
}
