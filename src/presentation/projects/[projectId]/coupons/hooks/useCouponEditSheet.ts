'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { type CouponView, useUpdateCoupon } from '@/contexts/coupon';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    UpdateCouponFormSchema,
    type UpdateCouponFormValues,
} from '../form/formData';

export const useCouponEditSheet = (projectId: string, coupon: CouponView) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useUpdateCoupon();

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

    return { isPending, form, onSubmit };
};
