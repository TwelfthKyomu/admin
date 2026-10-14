import { getServerSession } from '@/infrastructure/auth/getServerSession';
import {
    chatFileResponse,
    parseUploadSegments,
    projectFileResponse,
} from '@/infrastructure/storage/uploads';
import {
    requireProjectPermission,
    requireUserOrganization,
} from '@/shared/api/permission';
import { HTTP } from '@/shared/constants/http';
import { assertChannelAccess } from '@/contexts/chat/Chat.lib';
import { findChatAttachmentByFile } from '@/contexts/chat/ChatAttachment.lib';
import { CATALOG_READ_PERMISSIONS } from '@/contexts/user/User.types';

interface RouteContext {
    params: Promise<{ path: string[] }>;
}

const notFound = () => new Response('Not found', { status: HTTP.NOT_FOUND });
const forbidden = () => new Response('Forbidden', { status: HTTP.FORBIDDEN });

async function projectFile(
    userId: string,
    projectId: string,
    filename: string,
    contentType: string,
): Promise<Response> {
    let organizationId: string;

    try {
        ({ organizationId } = await requireProjectPermission(
            userId,
            projectId,
            CATALOG_READ_PERMISSIONS,
        ));
    } catch {
        return forbidden();
    }

    return projectFileResponse(
        organizationId,
        projectId,
        filename,
        contentType,
    );
}

async function chatFile(
    userId: string,
    channelId: string,
    filename: string,
): Promise<Response> {
    const found = await findChatAttachmentByFile(channelId, filename);

    if (!found || found.messageDeleted) return notFound();

    const { attachment, channel } = found;

    if (attachment.messageId === null && attachment.uploadedBy !== userId) {
        return notFound();
    }

    let organizationId: string;

    try {
        ({ id: organizationId } = await requireUserOrganization(userId));
        await assertChannelAccess(userId, organizationId, channel);
    } catch {
        return forbidden();
    }

    const disposition = attachment.contentType.startsWith('image/')
        ? 'inline'
        : `attachment; filename*=UTF-8''${encodeURIComponent(attachment.name)}`;

    return chatFileResponse(
        organizationId,
        channelId,
        filename,
        attachment.contentType,
        disposition,
    );
}

export async function GET(_request: Request, context: RouteContext) {
    const session = await getServerSession();

    if (!session?.user) {
        return new Response('Unauthorized', { status: HTTP.UNAUTHORIZED });
    }

    const { path: segments } = await context.params;
    const parsed = parseUploadSegments(segments ?? []);

    if (!parsed) return notFound();

    return parsed.kind === 'chat'
        ? chatFile(session.user.id, parsed.channelId, parsed.filename)
        : projectFile(
              session.user.id,
              parsed.projectId,
              parsed.filename,
              parsed.contentType,
          );
}
