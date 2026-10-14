import { getServerSession } from '@/infrastructure/auth/getServerSession';
import { detectFileType } from '@/infrastructure/storage/fileType';
import { saveChatFile } from '@/infrastructure/storage/uploads';
import { requireUserOrganization } from '@/shared/api/permission';
import { HTTP } from '@/shared/constants/http';
import { getErrorMessage } from '@/shared/lib/errors';
import { enforceRateLimit } from '@/shared/security/rate-limit';
import { getOrCreateChannel } from '@/contexts/chat/Chat.lib';
import { ChatTargetSchema } from '@/contexts/chat/Chat.schema';
import { CHAT_ATTACHMENT_MAX_BYTES } from '@/contexts/chat/Chat.types';
import { createChatAttachment } from '@/contexts/chat/ChatAttachment.lib';
import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import * as z from 'zod/mini';

const NAME_MAX = 255;

const fail = (error: string, status: number) =>
    NextResponse.json({ error }, { status });

function parseTarget(raw: FormDataEntryValue | null | undefined) {
    if (typeof raw !== 'string') return null;

    try {
        const parsed = z.safeParse(ChatTargetSchema, JSON.parse(raw));

        return parsed.success ? parsed.data : null;
    } catch {
        return null;
    }
}

export async function POST(request: Request) {
    const session = await getServerSession();

    if (!session?.user) return fail('Unauthorized', HTTP.UNAUTHORIZED);

    const userId = session.user.id;

    try {
        enforceRateLimit('upload', userId);
    } catch {
        return fail(
            'Слишком много загрузок. Попробуйте позже.',
            HTTP.TOO_MANY_REQUESTS,
        );
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    const target = parseTarget(form?.get('target'));

    if (!target) return fail('Не указан канал', HTTP.BAD_REQUEST);
    if (!(file instanceof File))
        return fail('Файл не передан', HTTP.BAD_REQUEST);
    if (file.size === 0) return fail('Файл пустой', HTTP.BAD_REQUEST);
    if (file.size > CHAT_ATTACHMENT_MAX_BYTES) {
        return fail(
            `Файл больше ${CHAT_ATTACHMENT_MAX_BYTES / 1024 / 1024} МБ`,
            HTTP.PAYLOAD_TOO_LARGE,
        );
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const fileType = await detectFileType(bytes, file.name);

    if (!fileType) {
        return fail(
            'Такой тип файла нельзя отправить: подойдут изображения, PDF, документы, таблицы, txt, csv и zip',
            HTTP.UNSUPPORTED_MEDIA_TYPE,
        );
    }

    let channelId: string;
    let organizationId: string;

    try {
        ({ id: organizationId } = await requireUserOrganization(userId));

        ({ id: channelId } = await getOrCreateChannel(
            userId,
            organizationId,
            target,
        ));
    } catch (error) {
        return fail(getErrorMessage(error), HTTP.FORBIDDEN);
    }

    const filename = `${randomBytes(12).toString('hex')}.${fileType.ext}`;

    await saveChatFile(
        organizationId,
        channelId,
        filename,
        bytes,
        fileType.contentType,
    );

    const attachment = await createChatAttachment({
        channelId,
        uploadedBy: userId,
        filename,
        name: file.name.trim().slice(0, NAME_MAX) || filename,
        contentType: fileType.contentType,
        sizeBytes: file.size,
    });

    return NextResponse.json(attachment);
}
