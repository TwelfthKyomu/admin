'use client';

import { broadcastScope } from '@/shared/realtime/scope';
import { useMutation } from '@tanstack/react-query';
import { nullToOptional } from './optional';

export function makeScopedMutation<TInput, TData>(
    action: (input: TInput) => Promise<TData>,
) {
    return function useScopedMutation(scopeId: string) {
        return useMutation({
            mutationFn: async (input: TInput) =>
                nullToOptional(await action(input)),
            onSuccess: () => broadcastScope(scopeId),
        });
    };
}

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
