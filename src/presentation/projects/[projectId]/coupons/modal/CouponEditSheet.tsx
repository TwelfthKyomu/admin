'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { type CouponView, useUpdateCoupon } from '@/contexts/coupon';
import { zodResolver } from '@hookform/resolvers/zod';
import { CouponForm } from '../form/CouponForm';
import { UpdateCouponFormSchema, type UpdateCouponFormValues } from '../form/formData';

interface CouponEditSheetProps {
    projectId: string;
    coupon: CouponView;
}

export const CouponEditSheet = ({ projectId, coupon }: CouponEditSheetProps) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateCoupon(projectId);

    const form = useForm<UpdateCouponFormValues>({
        resolver: zodResolver(UpdateCouponFormSchema),
        values: { ...coupon, projectId },
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<UpdateCouponFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `Купон ${coupon.code} обновлён`,
        });

        if (success) close();
    };

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
