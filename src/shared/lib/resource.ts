'use client';

import {
    type UseMutationResult,
    type UseQueryResult,
    useQuery,
} from '@tanstack/react-query';
import { makeMutation } from './mutations';
import type { NullToOptional } from './optional';
import { listQuery } from './queries';
import type { ActionResponse } from './safe-action';

type ListAction<TInput, TItem> = (
    input: TInput,
) => Promise<ActionResponse<TItem[]> | undefined | null>;

type AnyMutation = (input: never) => Promise<unknown>;

type MutationHook<A extends AnyMutation> = A extends (
    input: infer TInput,
) => Promise<infer TData>
    ? () => UseMutationResult<NullToOptional<TData>, Error, TInput, unknown>
    : never;

interface ListSpec<TArgs extends unknown[], TInput, TItem> {
    action: ListAction<TInput, TItem>;
    input: (...args: TArgs) => TInput;
    enabled?: (...args: TArgs) => boolean;
    staleTime?: number;
}

interface ResourceConfig<
    TArgs extends unknown[],
    TInput,
    TItem,
    TMutations extends Record<string, AnyMutation>,
> {
    key: readonly string[];
    list: ListSpec<TArgs, TInput, TItem>;
    mutations?: TMutations;
}

interface Resource<
    TArgs extends unknown[],
    TItem,
    TMutations extends Record<string, AnyMutation>,
> {
    useList: (...args: TArgs) => UseQueryResult<NullToOptional<TItem>[], Error>;
    mutations: { [K in keyof TMutations]: MutationHook<TMutations[K]> };
}

export const defineResource = <
    TArgs extends unknown[],
    TInput,
    TItem,
    TMutations extends Record<string, AnyMutation> = Record<never, AnyMutation>,
>(
    config: ResourceConfig<TArgs, TInput, TItem, TMutations>,
): Resource<TArgs, TItem, TMutations> => {
    const { key, list, mutations } = config;

    const mutationHooks = {} as Resource<TArgs, TItem, TMutations>['mutations'];

    for (const name of Object.keys(mutations ?? {}) as Array<
        Extract<keyof TMutations, string>
    >) {
        const action = mutations![name] as unknown as AnyMutation;

        (mutationHooks as Record<string, unknown>)[name] = makeMutation(action);
    }

    // biome-ignore lint/correctness/noComponentHookFactories: хук создаётся один раз при вызове defineResource на уровне модуля
    const useList = (...args: TArgs) => {
        const options: { enabled?: boolean; staleTime?: number } = {};
        const enabled = list.enabled?.(...args);

        if (enabled !== undefined) options.enabled = enabled;
        if (list.staleTime !== undefined) options.staleTime = list.staleTime;

        return useQuery(
            listQuery(
                [...key, 'list', ...args],
                () => list.action(list.input(...args)),
                options,
            ),
        );
    };

    return { useList, mutations: mutationHooks };
};
