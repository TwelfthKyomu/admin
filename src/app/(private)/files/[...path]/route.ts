import { getServerSession } from '@/infrastructure/auth/getServerSession';
import { parseUploadSegments } from '@/infrastructure/storage/uploadUrls';
import { notFoundResponse } from '@/shared/api/response';
import { HTTP } from '@/shared/constants/http';
import { serveChatFile } from '@/contexts/chat/ChatAttachment.lib';
import { serveProjectFile } from '@/contexts/projectFile/ProjectFile.lib';

interface RouteContext {
    params: Promise<{ path: string[] }>;
}

export const GET = async (_request: Request, context: RouteContext) => {
    const session = await getServerSession();

    if (!session?.user) {
        return new Response('Unauthorized', { status: HTTP.UNAUTHORIZED });
    }

    const { path: segments } = await context.params;
    const parsed = parseUploadSegments(segments ?? []);

    if (!parsed) return notFoundResponse();

    return parsed.kind === 'chat'
        ? serveChatFile(session.user.id, parsed.channelId, parsed.filename)
        : serveProjectFile(
              session.user.id,
              parsed.projectId,
              parsed.filename,
              parsed.contentType,
          );
};
