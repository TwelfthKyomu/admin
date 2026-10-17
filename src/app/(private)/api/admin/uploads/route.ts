import { getServerSession } from '@/infrastructure/auth/getServerSession';
import { detectImageType } from '@/infrastructure/storage/fileType';
import { saveProjectFile, uploadUrl } from '@/infrastructure/storage/uploads';
import { requireProjectPermission } from '@/shared/api/permission';
import { HTTP } from '@/shared/constants/http';
import { getErrorMessage } from '@/shared/lib/errors';
import { enforceRateLimit } from '@/shared/security/rate-limit';
import { findProjectBucket } from '@/contexts/integration/Integration.lib';
import { createProjectFile } from '@/contexts/projectFile/ProjectFile.lib';
import { storageQuotaError } from '@/contexts/subscription/Subscription.lib';
import { Permission } from '@/contexts/user/User.types';
import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
    const session = await getServerSession();

    if (!session?.user) {
        return NextResponse.json(
            { error: 'Unauthorized' },
            { status: HTTP.UNAUTHORIZED },
        );
    }

    try {
        enforceRateLimit('upload', session.user.id);
    } catch {
        return NextResponse.json(
            { error: 'Слишком много загрузок. Попробуйте позже.' },
            { status: HTTP.TOO_MANY_REQUESTS },
        );
    }

    const form = await request.formData().catch(() => null);
    const file = form?.get('file');
    const projectId = String(form?.get('projectId') ?? '');

    if (!projectId) {
        return NextResponse.json(
            { error: 'Не передан projectId' },
            { status: HTTP.BAD_REQUEST },
        );
    }

    if (!(file instanceof Blob)) {
        return NextResponse.json(
            { error: 'Файл не передан' },
            { status: HTTP.BAD_REQUEST },
        );
    }

    if (file.size > MAX_BYTES) {
        return NextResponse.json(
            {
                error: `Файл слишком большой (макс. ${MAX_BYTES / 1024 / 1024}MB)`,
            },
            { status: HTTP.PAYLOAD_TOO_LARGE },
        );
    }

    let organizationId: string;

    try {
        ({ organizationId } = await requireProjectPermission(
            session.user.id,
            projectId,
            Permission.MANAGE_CATALOG,
        ));
    } catch (error) {
        return NextResponse.json(
            { error: getErrorMessage(error) },
            { status: HTTP.FORBIDDEN },
        );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileType = await detectImageType(buffer);

    if (!fileType) {
        return NextResponse.json(
            { error: 'Поддерживаются только JPG, PNG, GIF и WebP' },
            { status: HTTP.UNSUPPORTED_MEDIA_TYPE },
        );
    }

    const quotaError = (await findProjectBucket(projectId))
        ? undefined
        : await storageQuotaError(organizationId, file.size);

    if (quotaError) {
        return NextResponse.json(
            { error: quotaError },
            { status: HTTP.PAYLOAD_TOO_LARGE },
        );
    }

    const filename = `${randomBytes(12).toString('hex')}.${fileType.ext}`;

    await saveProjectFile(
        organizationId,
        projectId,
        filename,
        buffer,
        fileType.contentType,
    );

    const url = uploadUrl(projectId, filename);

    await createProjectFile({
        projectId,
        url,
        sizeBytes: file.size,
    });

    return NextResponse.json({
        url,
        size: file.size,
        contentType: fileType.contentType,
    });
}
