'use client';

import { DELIVERY_STATUS_VARIANT, deliveryStatusLabel } from '@/shared/labels/delivery';
import { isOpenDelivery } from '@/contexts/delivery';
import type { OrderView } from '@/contexts/order';
import { Badge, Button } from '@/ui/Base';
import { useDeliverySection } from '../../hooks/useDeliverySection';
import { Section } from '../Section';
import { DeliveryActions } from './Actions';
import { DeliveryDetails } from './Details';

interface DeliverySectionProps {
    order: OrderView;
    projectId: string;
}

export const DeliverySection = ({ order, projectId }: DeliverySectionProps) => {
    const { canManage, delivery, couriers, openModal } = useDeliverySection(order, projectId);

    if (!delivery && !canManage) return null;

    return (
        <Section
            title="Доставка"
            aside={
                delivery && (
                    <Badge variant={DELIVERY_STATUS_VARIANT[delivery.status]}>
                        {deliveryStatusLabel(delivery.kind, delivery.status)}
                    </Badge>
                )
            }
        >
            {!delivery && (
                <div className="flex items-center justify-between gap-3 px-4 py-4 text-[13px]">
                    <span className="text-muted-foreground">Доставки нет.</span>
                    <Button
                        type="button"
                        size="sm"
                        onClick={() => openModal()}
                    >
                        Добавить доставку
                    </Button>
                </div>
            )}
            {delivery && <DeliveryDetails delivery={delivery} />}
            {delivery && canManage && isOpenDelivery(delivery.status) && (
                <DeliveryActions
                    projectId={projectId}
                    delivery={delivery}
                    couriers={couriers}
                    onEdit={() => openModal(delivery)}
                />
            )}
        </Section>
    );
};
