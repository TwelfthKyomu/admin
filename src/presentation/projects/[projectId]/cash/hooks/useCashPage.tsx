'use client';

import { useProject } from '@/app/providers';
import { modal } from '@/shared/lib/modal';
import { type CourierBalanceView, useCashSummary } from '@/contexts/cashShift';
import { Permission } from '@/contexts/user';
import dynamic from 'next/dynamic';

const CashShiftOpenSheet = dynamic(() =>
    import('../modal/CashShiftOpenSheet').then((m) => m.CashShiftOpenSheet),
);

const CashCollectSheet = dynamic(() =>
    import('../modal/CashCollectSheet').then((m) => m.CashCollectSheet),
);

const CashShiftCloseSheet = dynamic(() =>
    import('../modal/CashShiftCloseSheet').then((m) => m.CashShiftCloseSheet),
);

const CourierCashAcceptSheet = dynamic(() =>
    import('../modal/CourierCashAcceptSheet').then((m) => m.CourierCashAcceptSheet),
);

export function useCashPage() {
    const { projectId, currency, can } = useProject();
    const query = useCashSummary(projectId);

    const onOpenShift = () => modal.open(<CashShiftOpenSheet projectId={projectId} />);

    const onCollect = () => modal.open(<CashCollectSheet projectId={projectId} />);

    const onCloseShift = (expectedCash: number) =>
        modal.open(
            <CashShiftCloseSheet
                projectId={projectId}
                expectedCash={expectedCash}
            />,
        );

    const onAccept = (courier: CourierBalanceView) =>
        modal.open(
            <CourierCashAcceptSheet
                projectId={projectId}
                courier={courier}
                currency={currency}
            />,
        );

    return {
        query,
        currency,
        canManage: can(Permission.MANAGE_FINANCES),
        onOpenShift,
        onCollect,
        onCloseShift,
        onAccept,
    };
}
