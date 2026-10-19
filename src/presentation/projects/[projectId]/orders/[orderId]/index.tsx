'use client';

import { PageHeader, QueryBoundary } from '@/shared/components/common';
import { ROUTES } from '@/shared/constants';
import { fmtDateTime } from '@/shared/format/date';
import { orderNumber } from '@/contexts/order';
import { Button } from '@/ui/Base';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { CouponSection } from './components/CouponSection';
import { CustomerSection } from './components/CustomerSection';
import { DeliverySection } from './components/Delivery';
import { HistorySection } from './components/HistorySection';
import { ItemsSection } from './components/ItemsSection';
import { PaymentsSection } from './components/Payments';
import { SellerSection } from './components/SellerSection';
import { StatusSection } from './components/StatusSection';
import { useOrderDetailPage } from './hooks/useOrderDetailPage';

export const OrderDetailPage = () => {
    const {
        query,
        projectId,
        canEdit,
        canFinance,
        canManageFinance,
        canSeeSeller,
        sellerName,
        onChangeSeller,
    } = useOrderDetailPage();

    return (
        <QueryBoundary
            query={query}
            errorTitle="Не удалось загрузить заказ"
        >
            {({ order, items, events, couponCode }) => (
                <div className="flex flex-col gap-4">
                    <PageHeader
                        className="mb-0"
                        title={`Заказ ${orderNumber(order)}`}
                        description={`Создан ${fmtDateTime(order.createdAt)}`}
                        actions={
                            <Button
                                variant="outline"
                                size="sm"
                                asChild
                            >
                                <Link href={ROUTES.project(projectId, 'orders')}>
                                    <ArrowLeft />К заказам
                                </Link>
                            </Button>
                        }
                    />
                    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
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
                            {canSeeSeller && (
                                <SellerSection
                                    name={sellerName(order)}
                                    onChange={onChangeSeller && (() => onChangeSeller(order))}
                                />
                            )}
                            <CustomerSection order={order} />
                        </div>
                        <HistorySection
                            events={events}
                            currency={order.currency}
                        />
                    </div>
                </div>
            )}
        </QueryBoundary>
    );
};
