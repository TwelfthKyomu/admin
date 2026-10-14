'use client';

import { PageHeader, QueryBoundary, StatsRow } from '@/shared/components/common';
import { type TabItem, Table, Tabs } from '@/ui/Base';
import { type DeliveriesMode, useDeliveriesPage } from '../hooks/useDeliveriesPage';
import { CARRIER_COLUMNS } from './Column';
import { CourierSidebar } from './CourierSidebar';
import { DeliveryCard } from './DeliveryCard';

const MODE_TABS: TabItem<DeliveriesMode>[] = [
    { value: 'couriers', label: 'Курьеры' },
    { value: 'carriers', label: 'Службы доставки' },
];

export const DispatcherPanel = () => {
    const {
        projectId,
        currency,
        query,
        mode,
        setMode,
        stats,
        columns,
        carrierDeliveries,
        couriers,
        courierOptions,
        canManage,
        onAssign,
        onRequeue,
        onCancel,
    } = useDeliveriesPage();

    return (
        <>
            <PageHeader
                title="Доставки"
                description="Доставка создаётся в карточке заказа. Здесь — очередь, курьеры и статусы на сегодня."
                actions={
                    <Tabs<DeliveriesMode>
                        items={MODE_TABS}
                        value={mode}
                        onValueChange={setMode}
                    />
                }
            />
            <StatsRow items={stats} />
            <QueryBoundary
                query={query}
                errorTitle="Не удалось загрузить доставки"
            >
                {() =>
                    mode === 'carriers' ? (
                        <Table
                            columns={CARRIER_COLUMNS(projectId)}
                            data={carrierDeliveries}
                            emptyMessage="Отправок службами сегодня нет."
                            getRowId={(delivery) => delivery.id}
                        />
                    ) : (
                        <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_18rem]">
                            <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
                                {columns.map((column) => (
                                    <section
                                        key={column.key}
                                        className="grid content-start gap-2 rounded-xl bg-muted/50 p-2.5"
                                    >
                                        <header className="flex items-center gap-2 px-1 text-[13px] font-semibold">
                                            <span
                                                className={`size-2 rounded-full ${column.tone}`}
                                            />
                                            {column.title}
                                            <span className="font-normal text-muted-foreground">
                                                {column.items.length}
                                            </span>
                                        </header>
                                        {column.items.map((delivery) => (
                                            <DeliveryCard
                                                key={delivery.id}
                                                projectId={projectId}
                                                delivery={delivery}
                                                courierOptions={courierOptions}
                                                canManage={canManage}
                                                onAssign={onAssign}
                                                onRequeue={onRequeue}
                                                onCancel={onCancel}
                                            />
                                        ))}
                                    </section>
                                ))}
                            </div>
                            <CourierSidebar
                                couriers={couriers}
                                currency={currency}
                            />
                        </div>
                    )
                }
            </QueryBoundary>
        </>
    );
};
