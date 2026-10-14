import { nullToOptional } from '@/shared/lib/optional';
import { resolveInviteContext } from '@/contexts/projectInvite/ProjectInvite.lib';
import { AcceptInvitePage } from '@/presentation/invite';

export const instant = false;

interface InviteContentProps {
    params: Promise<{ token: string }>;
}

const Page = async ({ params }: InviteContentProps) => {
    const { token } = await params;
    const context = await resolveInviteContext(token);

    return (
        <AcceptInvitePage
            token={token}
            context={nullToOptional(context)}
        />
    );
};

export default Page;
