import { createEnv } from '@t3-oss/env-nextjs';
import * as z from 'zod/mini';

export const env = createEnv({
    server: {
        NODE_ENV: z._default(
            z.enum(['development', 'production', 'test']),
            'development',
        ),

        DATABASE_URL: z.url(),
        AUTH_SECRET: z.string().check(z.minLength(32)),
        ENCRYPTION_KEY: z.string().check(z.length(32)),
        BETTER_AUTH_URL: z.optional(z.url()),
        TRUSTED_PROXY_IPS: z.optional(z.string()),
        UPLOADS_DIR: z.optional(z.string()),
        AWS_ENDPOINT_URL_S3: z.optional(z.url()),
        AWS_REGION: z.optional(z.string()),
        AWS_ACCESS_KEY_ID: z.optional(z.string()),
        AWS_SECRET_ACCESS_KEY: z.optional(z.string()),
        S3_BUCKET: z.optional(z.string()),
        RESEND_API_KEY: z.optional(z.string().check(z.minLength(1))),
        EMAIL_FROM: z.optional(z.string().check(z.minLength(1))),
        BILLING_STRIPE_SECRET_KEY: z.optional(z.string().check(z.minLength(1))),
        BILLING_STRIPE_WEBHOOK_SECRET: z.optional(
            z.string().check(z.minLength(1)),
        ),
        GOOGLE_CLIENT_ID: z.optional(z.string().check(z.minLength(1))),
        GOOGLE_CLIENT_SECRET: z.optional(z.string().check(z.minLength(1))),
        GITHUB_CLIENT_ID: z.optional(z.string().check(z.minLength(1))),
        GITHUB_CLIENT_SECRET: z.optional(z.string().check(z.minLength(1))),
    },

    client: {
        NEXT_PUBLIC_APP_URL: z.url(),
        NEXT_PUBLIC_API_URL: z.optional(z.url()),
        NEXT_PUBLIC_APP_VERSION: z.optional(z.string()),
    },

    experimental__runtimeEnv: {
        NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_API_URL:
            process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_APP_URL,
        NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    },

    skipValidation: !!process.env.SKIP_ENV_VALIDATION,

    emptyStringAsUndefined: true,
});
