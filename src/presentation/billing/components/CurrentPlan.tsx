import { fmtBytes } from '@/shared/format/bytes';
import { fmtDate } from '@/shared/format/date';
import { type OrganizationSubscriptionStatus, PLAN_CATALOG } from '@/contexts/subscription';
import { Item, ItemContent, ItemDescription, ItemTitle } from '@/ui/Base';

interface CurrentPlanProps {
    status: OrganizationSubscriptionStatus;
}

export const CurrentPlan = ({
    status: {
        plan,
        planExpiresAt,
        projectLimit,
        projectsUsed,
        storageUsedBytes,
        storageLimitBytes,
    },
}: CurrentPlanProps) => {
    const info = PLAN_CATALOG[plan];

    return (
        <Item variant="muted">
            <ItemContent>
                <ItemDescription> Текущий тариф</ItemDescription>
                <ItemTitle>{info.label}</ItemTitle>
                {planExpiresAt && (
                    <ItemDescription>Оплачен до {fmtDate(planExpiresAt)}</ItemDescription>
                )}
            </ItemContent>
            <ItemContent>
                <ItemDescription>
                    Проектов: {projectsUsed} / {projectLimit}
                </ItemDescription>
                <ItemDescription>
                    Хранилище: {fmtBytes(storageUsedBytes)} / {fmtBytes(storageLimitBytes)}
                </ItemDescription>
            </ItemContent>
        </Item>
    );
};
