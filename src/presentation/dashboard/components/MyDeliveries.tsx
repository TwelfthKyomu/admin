import { Widget, WidgetBody, WidgetHeader } from '@/shared/components/common';
import type { MyDayView } from '@/contexts/order';
import type { ProjectView } from '@/contexts/project';
import { Truck } from 'lucide-react';
import { DeliveryRow } from './DeliveryRow';

interface MyDeliveriesProps {
    deliveries: MyDayView['deliveries'];
    projectById: Map<string, ProjectView>;
}

export const MyDeliveries = ({ deliveries, projectById }: MyDeliveriesProps) => (
    <Widget
        padding="md"
        className="gap-3"
    >
        <WidgetHeader icon={<Truck className="size-4" />}>Мои доставки в работе</WidgetHeader>
        <WidgetBody>
            <ul className="flex flex-col">
                {deliveries.map((delivery) => (
                    <DeliveryRow
                        key={delivery.id}
                        delivery={delivery}
                        project={projectById.get(delivery.projectId)}
                    />
                ))}
            </ul>
        </WidgetBody>
    </Widget>
);
