'use client';

import { PageHeader, QueryBoundary, StatsRow } from '@/shared/components/common';
import { CourierCash } from './components/CourierCash';
import { History } from './components/History';
import { MethodBars } from './components/MethodBars';
import { Movements } from './components/Movements';
import { ShiftActions } from './components/ShiftActions';
import { ShiftBadge } from './components/ShiftBadge';
import { useCashPage } from './hooks/useCashPage';
import { cashStats } from './lib/cashStats';

export const CashPage = () => {
    const { query, currency, canManage, onOpenShift, onCollect, onCloseShift, onAccept } =
        useCashPage();

    return (
        <QueryBoundary
            query={query}
            errorTitle="Не удалось загрузить кассу"
        >
            {({ shift, openedByName, totals, couriers, paymentsByMethod, movements, history }) => (
                <>
                    <PageHeader
                        title="Касса"
                        badge={
                            <ShiftBadge
                                openedAt={shift ? new Date(shift.createdAt) : undefined}
                                openedByName={openedByName}
                            />
                        }
                        description="Наличные курьеров числятся за ними, пока вы не примете их в кассу."
                        actions={
                            canManage && (
                                <ShiftActions
                                    isOpen={Boolean(shift)}
                                    onOpen={onOpenShift}
                                    onCollect={onCollect}
                                    onClose={() => onCloseShift(totals?.expectedCash ?? 0)}
                                />
                            )
                        }
                    />

                    {totals && <StatsRow items={cashStats(totals, currency)} />}

                    <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
                        <div className="grid gap-4">
                            <CourierCash
                                couriers={couriers}
                                currency={currency}
                                canAccept={canManage && !!shift}
                                onAccept={onAccept}
                            />
                            {shift && (
                                <MethodBars
                                    rows={paymentsByMethod}
                                    currency={currency}
                                />
                            )}
                        </div>
                        <div className="grid gap-4">
                            {shift && (
                                <Movements
                                    items={movements}
                                    currency={currency}
                                />
                            )}
                            <History
                                items={history}
                                currency={currency}
                            />
                        </div>
                    </div>
                </>
            )}
        </QueryBoundary>
    );
};
