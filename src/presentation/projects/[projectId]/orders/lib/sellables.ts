import {
    type ProductType,
    type ProductView,
    variantComboLabel,
} from '@/contexts/product';

export interface Sellable {
    key: string;
    productId: string;
    variantId?: string;
    name: string;
    type: ProductType;
    price: number;
    currency: ProductView['currency'];
    sku?: string;
    barcode?: string;
    stock?: number;
}

export const sellablesOf = (product: ProductView): Sellable[] => {
    const variants = product.variants.filter((variant) => variant.isActive);

    if (variants.length === 0) {
        return [
            {
                key: product.id,
                productId: product.id,
                name: product.name,
                type: product.type,
                price: product.price,
                currency: product.currency,
                sku: product.sku,
                barcode: product.barcode,
                stock: product.stock,
            },
        ];
    }

    return variants.map((variant) => ({
        key: `${product.id}:${variant.id}`,
        productId: product.id,
        variantId: variant.id,
        name: `${product.name} (${variantComboLabel(variant.optionValues)})`,
        type: product.type,
        price: variant.price ?? product.price,
        currency: product.currency,
        sku: variant.sku ?? product.sku,
        barcode: variant.barcode ?? product.barcode,
        stock: variant.stock,
    }));
};
