import type { DefaultValues } from 'react-hook-form';
import { Currency } from '@/shared/constants';
import { NONE } from '@/shared/lib/none';
import {
    CreateProductActionInputSchema,
    defaultAttributesFor,
    ProductStatus,
    ProductType,
    UpdateProductActionInputSchema,
} from '@/contexts/product';
import * as z from 'zod/mini';

export const CreateProductFormSchema = z.omit(CreateProductActionInputSchema, {
    projectId: true,
});

export const UpdateProductFormSchema = z.omit(UpdateProductActionInputSchema, {
    projectId: true,
});

export type CreateProductFormValues = z.input<typeof CreateProductFormSchema>;

export type UpdateProductFormValues = z.input<typeof UpdateProductFormSchema>;

export const PRODUCT_DEFAULT: DefaultValues<CreateProductFormValues> = {
    categoryId: NONE,
    type: ProductType.PHYSICAL,
    name: '',
    slug: '',
    sku: '',
    description: '',
    status: ProductStatus.ACTIVE,
    images: [],
    currency: Currency.RUB,
    badges: [],
    isFeatured: false,
    attributes: defaultAttributesFor(ProductType.PHYSICAL),
    options: [],
    variants: [],
};
