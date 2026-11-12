'use client';

import { FormDialog } from '@/shared/components/common';
import type { CouponView } from '@/contexts/coupon';
import { CouponForm } from '../form/CouponForm';
import { useCouponEditSheet } from '../hooks/useCouponEditSheet';

interface CouponEditSheetProps {
    projectId: string;
    coupon: CouponView;
}

export const CouponEditSheet = ({ projectId, coupon }: CouponEditSheetProps) => {
    const { isPending, form, onSubmit } = useCouponEditSheet(projectId, coupon);

    return (
        <FormDialog
            surface="sheet"
            title="Изменить купон"
            description="Код вводят на этапе заказа. Скидка считается только с подходящих позиций."
            form={form}
            onSubmit={onSubmit}
            submitLabel="Сохранить"
            busy={isPending}
        >
            <CouponForm projectId={projectId} />
        </FormDialog>
    );
};
