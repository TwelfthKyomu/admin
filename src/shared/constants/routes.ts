import { AUTH_ROUTE } from './auth';

const PROJECTS = '/projects';

export const ROUTES = {
    home: '/',
    auth: AUTH_ROUTE,
    chat: '/chat',
    billing: '/billing',
    audit: '/audit',
    users: '/users',
    profile: '/profile',
    terms: '/terms',
    invite: (token: string) => `/invite/${token}`,
    paymentWebhook: (integrationId: string) =>
        `/api/payments/webhook/${integrationId}`,
    billingWebhook: '/api/billing/webhook',
    projects: PROJECTS,
    project: (projectId: string, ...segments: string[]) =>
        [PROJECTS, projectId, ...segments].join('/'),
};
