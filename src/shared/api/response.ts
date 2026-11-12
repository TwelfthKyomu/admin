import { HTTP } from '@/shared/constants/http';
import { NextResponse } from 'next/server';

export const jsonError = (error: string, status: number) =>
    NextResponse.json({ error }, { status });

export const notFoundResponse = () =>
    new Response('Not found', { status: HTTP.NOT_FOUND });

export const forbiddenResponse = () =>
    new Response('Forbidden', { status: HTTP.FORBIDDEN });
