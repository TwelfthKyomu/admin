import { readFileSync } from 'node:fs';
import type { NextConfig } from 'next';

const isProduction = process.env.NODE_ENV === 'production';

const securityHeaders = [
    ...(isProduction
        ? [
              {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=63072000; includeSubDomains',
              },
          ]
        : []),
    {
        key: 'Content-Security-Policy',
        value: "frame-ancestors 'self'; object-src 'none'; base-uri 'self'",
    },
    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
    },
];

const storefrontDevCors = {
    source: '/api/storefront/:path*',
    headers: [
        { key: 'Access-Control-Allow-Origin', value: 'http://localhost:3001' },
        {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
        },
        {
            key: 'Access-Control-Allow-Headers',
            value: 'Authorization, Content-Type',
        },
    ],
};

const nextConfig: NextConfig = {
    env: {
        NEXT_PUBLIC_APP_VERSION: JSON.parse(readFileSync('package.json', 'utf8')).version,
    },
    reactStrictMode: true,
    reactCompiler: true,
    cacheComponents: true,
    partialPrefetching: true,
    poweredByHeader: false,
    experimental: {
        optimizePackageImports: [
            '@tanstack/react-query',
            '@tanstack/react-table',
            'cmdk',
            'radix-ui',
            'react-day-picker',
            'input-otp',
            'sonner',
        ],
        staleTimes: {
            dynamic: 30,
            static: 180,
        },
    },
    serverExternalPackages: ['pg'],
    compiler: {
        removeConsole: isProduction ? { exclude: ['error', 'warn'] } : false,
    },
    async headers() {
        return [
            ...(isProduction ? [] : [storefrontDevCors]),
            { source: '/:path*', headers: securityHeaders },
            {
                source: '/api/:path*',
                headers: [{ key: 'Cache-Control', value: 'no-store' }],
            },
        ];
    },
};

export default nextConfig;
