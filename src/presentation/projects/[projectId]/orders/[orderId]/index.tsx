'use client';

import { QueryBoundary } from '@/shared/components/common';
import { CouponSection } from './components/CouponSection';
import { CustomerSection } from './components/CustomerSection';
import { DeliverySection } from './components/Delivery';
import { HistorySection } from './components/HistorySection';
import { ItemsSection } from './components/ItemsSection';
import { PaymentsSection } from './components/Payments';
import { StatusSection } from './components/StatusSection';
import { useOrderDetailPage } from './hooks/useOrderDetailPage';

export const OrderDetailPage = () => {
    const { query, projectId, canEdit, canFinance, canManageFinance } = useOrderDetailPage();

    return (
        <QueryBoundary
            query={query}
            errorTitle="Не удалось загрузить заказ"
        >
            {({ order, items, events, couponCode }) => (
                <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="flex min-w-0 flex-col gap-4">
                        <StatusSection
                            order={order}
                            projectId={projectId}
                            canEdit={canEdit}
                        />
                        <ItemsSection
                            order={order}
                            items={items}
                        />
                        {canManageFinance && (
                            <CouponSection
                                order={order}
                                couponCode={couponCode}
                                projectId={projectId}
                            />
                        )}
                        {canFinance && (
                            <PaymentsSection
                                order={order}
                                projectId={projectId}
                                canManage={canManageFinance}
                            />
                        )}
                        <DeliverySection
                            order={order}
                            projectId={projectId}
                        />
                        <CustomerSection order={order} />
                    </div>
                    <HistorySection
                        events={events}
                        currency={order.currency}
                    />
                </div>
            )}
        </QueryBoundary>
    );
};
