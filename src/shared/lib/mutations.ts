'use client';

import { useMutation } from '@tanstack/react-query';
import { nullToOptional } from './optional';

export const makeMutation = <TInput, TData>(
    action: (input: TInput) => Promise<TData>,
) => {
    // biome-ignore lint/correctness/noComponentHookFactories: хук мутации создаётся один раз на действие при загрузке модуля
    return function useAppMutation() {
        return useMutation({
            mutationFn: async (input: TInput) =>
                nullToOptional(await action(input)),
        });
    };
};
