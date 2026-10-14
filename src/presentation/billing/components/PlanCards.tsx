'use client';

import { DEFAULT_CURRENCY } from '@/shared/constants/currency';
import { fmtBytes } from '@/shared/format/bytes';
import { fmtMoney } from '@/shared/format/money';
import { runAction } from '@/shared/lib/action-result';
import { toast } from '@/shared/lib/toast';
import {
    BILLING_PERIOD_LABEL,
    type BillingPeriod,
    LIMITS_BY_PLAN,
    PLAN_CATALOG,
    type SubscriptionPlan,
    usePurchasePlan,
} from '@/contexts/subscription';
import {
    Badge,
    Button,
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/ui/Base';
import { useRouter } from 'next/navigation';

interface PlanCardsProps {
    plan: SubscriptionPlan;
    period: BillingPeriod;
    currentPlan: SubscriptionPlan;
    isOwner: boolean;
    billingEnabled: boolean;
}

export const PlanCards = ({
    plan,
    period,
    currentPlan,
    isOwner,
    billingEnabled,
}: PlanCardsProps) => {
    const { refresh } = useRouter();
    const { mutateAsync, isPending } = usePurchasePlan();
    const info = PLAN_CATALOG[plan];
    const limits = LIMITS_BY_PLAN[plan];
    const isCurrent = plan === currentPlan;
    const price = info.price[period];
    const isFree = price === 0;

    const select = async () => {
        const { success, response } = await runAction(mutateAsync({ plan, period }), {});
        const result = response?.data;

        if (!success || !result) return;

        if (result.mode === 'redirect') {
            window.location.assign(result.url);

            return;
        }

        toast.success(`Тариф изменён на ${info.label}`);
        refresh();
    };

    const unavailable = !isFree && !billingEnabled;

    return (
        <Card>
            <CardHeader>
                <CardTitle>{info.label}</CardTitle>
                {isCurrent && (
                    <CardAction>
                        <Badge variant="secondary"> текущий</Badge>
                    </CardAction>
                )}
                <CardTitle>
                    {isFree
                        ? 'Бесплатно'
                        : `${fmtMoney(price, DEFAULT_CURRENCY)} в ${BILLING_PERIOD_LABEL[period]}`}
                </CardTitle>
                <CardDescription>{info.tagline}</CardDescription>
            </CardHeader>
            <CardContent>
                <ul className="flex flex-col gap-1 text-[13px] text-muted-foreground">
                    <li>Проектов: {limits.projects}</li>
                    <li>Товаров на проект: {limits.productsPerProject}</li>
                    <li>Бейджей на проект: {limits.badgesPerProject}</li>
                    <li>Хранилище: {fmtBytes(limits.storageBytes)}</li>
                </ul>
            </CardContent>
            {(!isFree || !isCurrent) && (
                <CardFooter className="flex-col items-stretch gap-1.5">
                    <Button
                        type="button"
                        variant={isCurrent ? 'outline' : 'default'}
                        disabled={!isOwner || isPending || unavailable}
                        onClick={select}
                        className="w-full"
                    >
                        {isFree ? 'Перейти на Free' : isCurrent ? 'Продлить' : 'Оплатить и перейти'}
                    </Button>
                    {unavailable && (
                        <p className="text-[12px] text-muted-foreground">
                            Оплата тарифов ещё не настроена
                        </p>
                    )}
                </CardFooter>
            )}
        </Card>
    );
};
