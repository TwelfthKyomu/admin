'use client';

import { type ActionResponse, extractActionError } from './safe-action';
import { toast } from './toast';

interface RunActionOptions {
    success?: string;
}

interface RunActionResult<R> {
    success: boolean;
    response: R | undefined;
}

export async function runAction<R extends ActionResponse>(
    action: Promise<R | undefined>,
    options?: RunActionOptions,
): Promise<RunActionResult<R>> {
    const response = await action;
    const error = extractActionError(response);

    if (error) {
        toast.error(error);

        return { success: false, response };
    }

    if (options?.success) {
        toast.success(options.success);
    }

    return { success: true, response };
}
