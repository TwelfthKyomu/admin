import type { InviteView } from '@/contexts/projectInvite';

export const PreviewHeader = ({ preview }: { preview: InviteView }) => (
    <>
        <h1 className="text-lg font-semibold">Приглашение в проект «{preview.projectName}»</h1>
        <p className="mt-2 text-sm text-muted-foreground">
            {preview.organizationName ? `Организация «${preview.organizationName}». ` : ''}
            {preview.inviterName ? `Пригласил: ${preview.inviterName}. ` : ''}
        </p>
    </>
);
