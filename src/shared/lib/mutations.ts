'use client';

import { useMutation } from '@tanstack/react-query';
import { nullToOptional } from './optional';

export function makeMutation<TInput, TData>(
    action: (input: TInput) => Promise<TData>,
) {
    return function useAppMutation() {
        return useMutation({
            mutationFn: async (input: TInput) =>
                nullToOptional(await action(input)),
        });
    };
}
