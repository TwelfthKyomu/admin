import {
    buildVariantCombinations,
    type ProductOption,
    variantComboKey,
} from '@/contexts/product';
import type { CreateProductFormValues } from '../form/formData';

type VariantFormValue = NonNullable<
    CreateProductFormValues['variants']
>[number];

export function buildVariants(
    options: ProductOption[],
    variants: VariantFormValue[],
): VariantFormValue[] {
    const existingByKey = new Map(
        variants.map((variant) => [
            variantComboKey(variant.optionValues),
            variant,
        ]),
    );

    return buildVariantCombinations(options).map((optionValues, position) => {
        const existing = existingByKey.get(variantComboKey(optionValues));

        if (existing) return { ...existing, optionValues, position };

        return {
            optionValues,
            sku: null,
            price: null,
            isActive: true,
            position,
        };
    });
}
