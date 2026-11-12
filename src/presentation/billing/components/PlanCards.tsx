'use client';

import { DEFAULT_CURRENCY } from '@/shared/constants/currency';
import { fmtBytes } from '@/shared/format/bytes';
import { fmtMoney } from '@/shared/format/money';
import {
    BILLING_PERIOD_LABEL,
    type BillingPeriod,
    BillingProvider,
    LIMITS_BY_PLAN,
    PLAN_CATALOG,
    type SubscriptionPlan,
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
import { usePlanPurchase } from '../hooks/usePlanPurchase';
import { planActionLabel } from '../lib/planActionLabel';

interface PlanCardsProps {
    plan: SubscriptionPlan;
    period: BillingPeriod;
    currentPlan: SubscriptionPlan;
    isOwner: boolean;
    billingProvider: BillingProvider;
}

export const PlanCards = ({
    plan,
    period,
    currentPlan,
    isOwner,
    billingProvider,
}: PlanCardsProps) => {
    const { select, isPending } = usePlanPurchase(plan, period);
    const info = PLAN_CATALOG[plan];
    const limits = LIMITS_BY_PLAN[plan];
    const isCurrent = plan === currentPlan;
    const price = info.price[period];
    const isFree = price === 0;

    const isTestPayment = !isFree && billingProvider === BillingProvider.TEST;

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
                        disabled={!isOwner || isPending}
                        onClick={select}
                        className="w-full"
                    >
                        {planActionLabel(isFree, isCurrent)}
                    </Button>
                    {isTestPayment && (
                        <p className="text-[12px] text-muted-foreground">
                            Тестовый режим: деньги не списываются
                        </p>
                    )}
                </CardFooter>
            )}
        </Card>
    );
};
