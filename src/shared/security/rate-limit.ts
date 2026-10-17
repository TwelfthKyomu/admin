import 'server-only';

import { ApplicationError } from '@/shared/api/errors';

const WINDOW_MS = 60_000;

const LIMITS_PER_MINUTE = {
    mutation: 240,
    upload: 60,
    billing: 10,
    'invite:create': 30,
    'invite:accept': 20,
    'payment:connect': 5,
    'storage:connect': 5,
    'payment:create': 30,
    'payment:refund': 10,
    'storefront:read': 300,
    'storefront:order': 30,
    'storefront:auth': 10,
    realtime: 120,
};

export type RateLimitKey = keyof typeof LIMITS_PER_MINUTE;

interface Bucket {
    count: number;
    resetAt: number;
}

const SWEEP_THRESHOLD = 10_000;

const buckets = new Map<string, Bucket>();

function sweepExpired(now: number): void {
    if (buckets.size < SWEEP_THRESHOLD) return;

    for (const [key, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(key);
    }
}

export class RateLimitError extends ApplicationError {}

export function enforceRateLimit(key: RateLimitKey, identifier: string): void {
    const now = Date.now();
    const bucketKey = `${key}:${identifier}`;
    const bucket = buckets.get(bucketKey);

    if (!bucket || bucket.resetAt <= now) {
        sweepExpired(now);
        buckets.set(bucketKey, { count: 1, resetAt: now + WINDOW_MS });

        return;
    }

    bucket.count += 1;

    if (bucket.count > LIMITS_PER_MINUTE[key]) {
        throw new RateLimitError(
            'Слишком много запросов, попробуйте через минуту',
        );
    }
}
