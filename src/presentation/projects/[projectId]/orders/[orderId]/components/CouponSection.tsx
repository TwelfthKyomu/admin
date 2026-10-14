'use client';

import { useState } from 'react';
import { fmtMoney } from '@/shared/format/money';
import { runAction } from '@/shared/lib/action-result';
import { toast } from '@/shared/lib/toast';
import { useRedeemCoupon } from '@/contexts/coupon';
import type { OrderView } from '@/contexts/order';
import { Button, Input } from '@/ui/Base';
import { Section } from './Section';

interface CouponSectionProps {
    order: OrderView;
    couponCode?: string;
    projectId: string;
}

export const CouponSection = ({ order, couponCode, projectId }: CouponSectionProps) => {
    const [code, setCode] = useState('');
    const { mutateAsync, isPending } = useRedeemCoupon(projectId);

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

    if (couponCode) {
        return (
            <Section
                title="Промокод"
                aside={
                    <span className="text-[12px] tabular-nums text-muted-foreground">
                        Скидка: {fmtMoney(order.discountAmount, order.currency)}
                    </span>
                }
            >
                <p className="px-4 py-3 font-mono text-sm">{couponCode}</p>
            </Section>
        );
    }

    if (order.paidAmount > 0) return null;

    return (
        <Section title="Промокод">
            <div className="flex items-center gap-2 px-4 py-3">
                <Input
                    value={code}
                    placeholder="SUMMER-10"
                    onChange={(event) => setCode(event.target.value.toUpperCase())}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                            event.preventDefault();
                            void apply();
                        }
                    }}
                    className="font-mono"
                    disabled={isPending}
                />
                <Button
                    size="sm"
                    disabled={!code.trim() || isPending}
                    onClick={apply}
                >
                    Применить
                </Button>
            </div>
        </Section>
    );
};
