import { HTTP } from '@/shared/constants/http';
import {
    authenticateStorefront,
    isValidStorefrontSignature,
    storefrontErrorResponse,
    storefrontImageResponse,
} from '@/contexts/storefront/Storefront.lib';
import { connection } from 'next/server';

interface RouteContext {
    params: Promise<{ filename: string }>;
}

export async function GET(request: Request, context: RouteContext) {
    await connection();

    try {
        const { filename } = await context.params;
        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const signature = searchParams.get('signature');

        const signed =
            projectId && signature
                ? isValidStorefrontSignature(
                      `${projectId}:${filename}`,
                      signature,
                  )
                : false;

        if (!signed) {
            const access = await authenticateStorefront(
                request,
                'storefront:read',
            );

            if (!projectId || access.projectId !== projectId) {
                return new Response('Not found', { status: HTTP.NOT_FOUND });
            }
        }

        return await storefrontImageResponse(projectId ?? '', filename);
    } catch (error) {
        return storefrontErrorResponse(error);
    }
}
