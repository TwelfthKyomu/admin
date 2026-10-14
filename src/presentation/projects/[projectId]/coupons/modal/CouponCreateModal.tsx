'use client';

import { type SubmitHandler, useForm } from 'react-hook-form';
import { FormDialog } from '@/shared/components/common';
import { runAction } from '@/shared/lib/action-result';
import { useModalClose } from '@/shared/lib/modal';
import { useCreateCoupon } from '@/contexts/coupon';
import { zodResolver } from '@hookform/resolvers/zod';
import { CouponForm } from '../form/CouponForm';
import {
    COUPON_DEFAULT,
    CreateCouponFormSchema,
    type CreateCouponFormValues,
} from '../form/formData';

export const CouponCreateModal = ({ projectId }: { projectId: string }) => {
    const close = useModalClose();
    const { mutateAsync, isPending } = useCreateCoupon(projectId);

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
