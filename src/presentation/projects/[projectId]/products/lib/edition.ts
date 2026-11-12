import { editionSizeOf, type ProductView } from '@/contexts/product';

export const editionLabel = (
    product: Pick<ProductView, 'attributes' | 'soldCount'>,
): string | undefined => {
    const size = editionSizeOf(product.attributes);

    if (size === undefined) return undefined;

    return `тираж: продано ${product.soldCount} из ${size}`;
};
