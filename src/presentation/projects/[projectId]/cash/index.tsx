'use client';

import { PageHeader, QueryBoundary, StatsRow } from '@/shared/components/common';
import { fmtTime } from '@/shared/format/date';
import { fmtMoney } from '@/shared/format/money';
import { Badge, Button } from '@/ui/Base';
import { CourierCash } from './components/CourierCash';
import { History } from './components/History';
import { MethodBars } from './components/MethodBars';
import { Movements } from './components/Movements';
import { useCashPage } from './hooks/useCashPage';

export const CashPage = () => {
    const { query, currency, canManage, onOpenShift, onCollect, onCloseShift, onAccept } =
        useCashPage();

    const money = (amount: number) => fmtMoney(amount, currency);

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
                            shift ? (
                                <Badge className="bg-green-100 text-green-800">
                                    Смена открыта с {fmtTime(new Date(shift.createdAt))}
                                    {openedByName && ` · ${openedByName}`}
                                </Badge>
                            ) : (
                                <Badge variant="outline">Смена закрыта</Badge>
                            )
                        }
                        description="Наличные курьеров числятся за ними, пока вы не примете их в кассу."
                        actions={
                            !canManage ? null : shift ? (
                                <>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={onCollect}
                                    >
                                        Инкассация
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => onCloseShift(totals?.expectedCash ?? 0)}
                                    >
                                        Закрыть смену
                                    </Button>
                                </>
                            ) : (
                                <Button
                                    size="sm"
                                    onClick={onOpenShift}
                                >
                                    Открыть смену
                                </Button>
                            )
                        }
                    />

                    {totals && (
                        <StatsRow
                            items={[
                                { label: 'Начальная сумма', value: money(totals.openingAmount) },
                                {
                                    label: 'Наличные в кассе',
                                    value: `+${money(totals.registerCharges)}`,
                                },
                                { label: 'Сдано курьерами', value: `+${money(totals.handovers)}` },
                                {
                                    label: 'Инкассации и возвраты',
                                    value: `−${money(totals.collections + totals.registerRefunds)}`,
                                },
                                { label: 'Ожидается в кассе', value: money(totals.expectedCash) },
                            ]}
                        />
                    )}

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
