'use client';

import { useState } from 'react';
import { fmtMoney } from '@/shared/format/money';
import { runAction } from '@/shared/lib/action-result';
import { toast } from '@/shared/lib/toast';
import { useRedeemCoupon } from '@/contexts/coupon';
import type { OrderView } from '@/contexts/order';

export const useCouponSection = (order: OrderView, projectId: string) => {
    const [code, setCode] = useState('');
    const { mutateAsync, isPending } = useRedeemCoupon();

    const apply = async () => {
        const trimmed = code.trim();

        if (!trimmed) return;

        const { success, response } = await runAction(
            mutateAsync({ projectId, orderId: order.id, code: trimmed }),
        );

        if (!success) return;

        toast.success(
            `Применена скидка ${fmtMoney(response?.data?.discountAmount ?? 0, order.currency)}`,
        );

        setCode('');
    };

    return { code, setCode, isPending, apply };
};
