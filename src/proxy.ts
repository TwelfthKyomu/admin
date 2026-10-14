import {
    AUTH_COOKIE_PREFIX,
    AUTH_ROUTE,
    STALE_SESSION_PARAM,
    STALE_SESSION_VALUE,
} from '@/shared/constants/auth';
import { getSessionCookie } from 'better-auth/cookies';
import { type NextRequest, NextResponse } from 'next/server';

const PUBLIC_PREFIXES = [AUTH_ROUTE, '/api', '/invite', '/terms'];

function stripCookiePrefix(name: string) {
    if (name.startsWith('__Secure-')) return name.slice('__Secure-'.length);
    if (name.startsWith('__Host-')) return name.slice('__Host-'.length);

    return name;
}

function clearAuthCookies(request: NextRequest, response: NextResponse) {
    for (const cookie of request.cookies.getAll()) {
        if (!stripCookiePrefix(cookie.name).startsWith(AUTH_COOKIE_PREFIX)) {
            continue;
        }

        response.cookies.set(cookie.name, '', {
            path: '/',
            maxAge: 0,
            secure: cookie.name.startsWith('__Secure-'),
        });
    }

    return response;
}

export function proxy(request: NextRequest) {
    const { pathname, searchParams } = request.nextUrl;

    const sessionCookie = getSessionCookie(request);
    const isAuthRoute = pathname.startsWith(AUTH_ROUTE);

    const isPublic = PUBLIC_PREFIXES.some((prefix) =>
        pathname.startsWith(prefix),
    );

    if (
        isAuthRoute &&
        searchParams.get(STALE_SESSION_PARAM) === STALE_SESSION_VALUE
    ) {
        return clearAuthCookies(request, NextResponse.next());
    }

    if (sessionCookie && isAuthRoute) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    if (!sessionCookie && !isPublic) {
        const loginUrl = new URL(AUTH_ROUTE, request.url);

        loginUrl.searchParams.set(
            'callbackUrl',
            pathname + request.nextUrl.search,
        );

        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
