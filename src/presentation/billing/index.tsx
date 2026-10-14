'use client';

import { useState } from 'react';
import { useStaticData } from '@/app/providers';
import { QueryBoundary } from '@/shared/components/common';
import {
    BillingPeriod,
    SUBSCRIPTION_PLAN_VALUES,
    useSubscriptionStatus,
} from '@/contexts/subscription';
import { type TabItem, Tabs } from '@/ui/Base';
import { useSearchParams } from 'next/navigation';
import { CurrentPlan } from './components/CurrentPlan';
import { PlanCards } from './components/PlanCards';

const PERIOD_TABS: TabItem<BillingPeriod>[] = [
    { value: BillingPeriod.MONTH, label: 'Помесячно' },
    { value: BillingPeriod.YEAR, label: 'За год — 2 месяца в подарок' },
];

export const BillingPage = () => {
    const { organization, user } = useStaticData();
    const [period, setPeriod] = useState<BillingPeriod>(BillingPeriod.MONTH);
    const query = useSubscriptionStatus();
    const justPaid = useSearchParams().get('paid') === '1';
    const isOwner = organization.createdBy === user.id;

    return (
        <QueryBoundary
            query={query}
            isEmpty={(status) => status === null}
            errorTitle="Не удалось загрузить тариф"
        >
            {(status) => (
                <div className="flex flex-col gap-5">
                    {justPaid && (
                        <p className="text-[13px] text-muted-foreground">
                            Оплата получена. Тариф включится, как только платёжная система
                            подтвердит её — обычно в течение минуты.
                        </p>
                    )}
                    <CurrentPlan status={status} />
                    <Tabs<BillingPeriod>
                        items={PERIOD_TABS}
                        value={period}
                        onValueChange={setPeriod}
                    />
                    <div className="grid gap-3 sm:grid-cols-3">
                        {SUBSCRIPTION_PLAN_VALUES.map((plan) => (
                            <PlanCards
                                key={plan}
                                plan={plan}
                                period={period}
                                currentPlan={status.plan}
                                isOwner={isOwner}
                                billingEnabled={status.billingEnabled}
                            />
                        ))}
                    </div>
                </div>
            )}
        </QueryBoundary>
    );
};
