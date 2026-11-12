'use client';

import { FormDialog } from '@/shared/components/common';
import { CouponForm } from '../form/CouponForm';
import { useCouponCreateModal } from '../hooks/useCouponCreateModal';

export const CouponCreateModal = ({ projectId }: { projectId: string }) => {
    const { isPending, form, onSubmit } = useCouponCreateModal(projectId);

    return (
        <FormDialog
            title="Новый купон"
            description="Код вводят на этапе заказа. Скидка считается только с подходящих позиций."
            className="max-w-md"
            form={form}
            onSubmit={onSubmit}
            submitLabel="Создать"
            busy={isPending}
        >
            <CouponForm projectId={projectId} />
        </FormDialog>
    );
};
