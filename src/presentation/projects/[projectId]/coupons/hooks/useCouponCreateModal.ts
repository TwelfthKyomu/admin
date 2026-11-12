'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { useCreateCoupon } from '@/contexts/coupon';
import { zodResolver } from '@hookform/resolvers/zod';
import {
    COUPON_DEFAULT,
    CreateCouponFormSchema,
    type CreateCouponFormValues,
} from '../form/formData';

export const useCouponCreateModal = (projectId: string) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateCoupon();

    const form = useForm<CreateCouponFormValues>({
        resolver: zodResolver(CreateCouponFormSchema),
        defaultValues: { ...COUPON_DEFAULT, projectId },
        mode: 'onChange',
    });

    const onSubmit: SubmitHandler<CreateCouponFormValues> = async (values) => {
        const { success } = await runAction(mutateAsync(values), {
            success: `Купон ${values.code} создан`,
        });

        if (success) close();
    };

    return { isPending, form, onSubmit };
};
