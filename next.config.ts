import { readFileSync } from 'node:fs';
import { loadEnvConfig } from '@next/env';
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
loadEnvConfig(process.cwd());

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
            'lucide-react',
            '@tanstack/react-query',
            '@tanstack/react-table',
            'radix-ui',
            'cmdk',
            'react-day-picker',
            '@dnd-kit/react',
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
        removeConsole:
            process.env.NODE_ENV === 'production'
                ? { exclude: ['error', 'warn'] }
                : false,
    },
    async headers() {
        const storefrontCorsHeaders =
            process.env.NODE_ENV === 'development'
                ? [
                      {
                          source: '/api/storefront/:path*',
                          headers: [
                              {
                                  key: 'Access-Control-Allow-Origin',
                                  value: 'http://localhost:3001',
                              },
                              {
                                  key: 'Access-Control-Allow-Methods',
                                  value: 'GET, POST, PUT, DELETE, OPTIONS',
                              },
                              {
                                  key: 'Access-Control-Allow-Headers',
                                  value: 'Authorization, Content-Type',
                              },
                          ],
                      },
                  ]
                : [];

        const commonHeaders = [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-DNS-Prefetch-Control', value: 'on' },
                    {
                        key: 'Strict-Transport-Security',
                        value: 'max-age=300; includeSubDomains',
                    },
                    { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-XSS-Protection', value: '1; mode=block' },
                    { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
                    {
                        key: 'Permissions-Policy',
                        value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
                    },
                ],
            },
            {
                source: '/api/:path*',
                headers: [
                    { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'X-Frame-Options', value: 'DENY' },
                ],
            },
        ];

        if (process.env.NODE_ENV === 'production') {
            return [
                ...commonHeaders,
                {
                    source: '/_next/static/:path*',
                    headers: [
                        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                    ],
                },
                {
                    source: '/public/:path*',
                    headers: [
                        { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
                    ],
                },
            ];
        }

        return [...storefrontCorsHeaders, ...commonHeaders];
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'admin.dannis.online',
            },
        ],
        formats: ['image/webp', 'image/avif'],
        deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
        imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

        minimumCacheTTL: 2678400,
    },
};

export default withNextIntl(nextConfig);
