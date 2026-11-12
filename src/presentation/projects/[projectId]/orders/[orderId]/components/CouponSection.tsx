'use client';

import { fmtMoney } from '@/shared/format/money';
import type { OrderView } from '@/contexts/order';
import { Button, Input } from '@/ui/Base';
import { useCouponSection } from '../hooks/useCouponSection';
import { Section } from './Section';

interface CouponSectionProps {
    order: OrderView;
    couponCode?: string;
    projectId: string;
}

export const CouponSection = ({ order, couponCode, projectId }: CouponSectionProps) => {
    const { code, setCode, isPending, apply } = useCouponSection(order, projectId);

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
                    placeholder="Код промокода"
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
