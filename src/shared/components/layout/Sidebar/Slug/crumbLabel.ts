import { ORDER_LABEL, segmentLabel } from '@/shared/labels/navigation';
import { orderNumber } from '@/contexts/order/Order.types';

export const crumbLabel = (
    segment: string,
    previous: string | undefined,
    projectName: string | undefined,
): string => {
    if (projectName) return projectName;
    if (previous === 'orders')
        return `${ORDER_LABEL} ${orderNumber({ id: segment })}`;

    return segmentLabel(segment);
};
