import type { ProductView } from '@/contexts/product';

const DEFAULT_SERVICE_MINUTES = 60;

export function serviceMinutes(product: ProductView): number {
    return (
        Number(product.attributes.durationMinutes) || DEFAULT_SERVICE_MINUTES
    );
}
