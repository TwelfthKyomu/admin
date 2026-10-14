'use client';

import { useProject } from '@/app/providers';
import { confirmDestructive, modal } from '@/shared/lib/modal';
import { type CouponView, useCouponsList, useDeleteCoupon } from '@/contexts/coupon';
import dynamic from 'next/dynamic';

const CouponCreateModal = dynamic(() =>
    import('../modal/CouponCreateModal').then((m) => m.CouponCreateModal),
);

const CouponEditSheet = dynamic(() =>
    import('../modal/CouponEditSheet').then((m) => m.CouponEditSheet),
);

export function useCouponsPage() {
    const { projectId, currency } = useProject();
    const query = useCouponsList(projectId);
    const { mutateAsync, isPending } = useDeleteCoupon(projectId);

    const onCreate = () => modal.open(<CouponCreateModal projectId={projectId} />);

    const onEdit = (coupon: CouponView) =>
        modal.open(
            <CouponEditSheet
                projectId={projectId}
                coupon={coupon}
            />,
        );

    const onDelete = (coupon: CouponView) =>
        confirmDestructive({
            title: 'Удалить купон?',
            description: (
                <>
                    Купон <strong>«{coupon.code}»</strong> будет удалён. Уже применённые скидки в
                    заказах останутся.
                </>
            ),
            success: `Купон ${coupon.code} удалён`,
            onConfirm: () => mutateAsync({ id: coupon.id, projectId }),
        });

    return { query, currency, onCreate, onEdit, onDelete, isDeleting: isPending };
}
