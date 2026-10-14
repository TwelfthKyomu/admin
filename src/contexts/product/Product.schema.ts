import { ApplicationError } from '@/shared/api/errors';
import { CURRENCY_VALUES } from '@/shared/constants/currency';
import {
    CODE_MAX,
    DURATION_MINUTES_MAX,
    IMAGES_PER_ENTITY_MAX,
    LABEL_MAX,
    PAGE_SIZE_DEFAULT,
    SKU_MAX,
    SKU_MIN,
    SLUG_MAX,
    TEXT_MAX,
    TITLE_MAX,
} from '@/shared/constants/default';
import {
    imageUrlField,
    LOWER_CODE_PATTERN,
    slugField,
    textField,
    upperCodeField,
} from '@/shared/validation';
import {
    entityInProjectSchema,
    idSchema,
    optionalText,
} from '@/shared/validation/base';
import * as z from 'zod/mini';
import {
    PRODUCT_BADGE_MAX,
    PRODUCT_OPTION_VALUES_MAX,
    PRODUCT_OPTIONS_MAX,
    PRODUCT_STATUS_VALUES,
    PRODUCT_TYPE_VALUES,
    ProductType,
} from './Product.types';

const PhysicalAttributesSchema = z.object({
    weightGrams: z.nullish(z.int().check(z.nonnegative())),
    editionSize: z.nullish(z.int().check(z.positive())),
});

const ServiceAttributesSchema = z.object({
    durationMinutes: z.int().check(z.positive(), z.lte(DURATION_MINUTES_MAX)),
    bookable: z._default(z.boolean(), true),
    bufferMinutes: z._default(z.int().check(z.nonnegative(), z.lte(180)), 0),
});

function attributesSchemaFor(type: ProductType) {
    switch (type) {
        case ProductType.SERVICE:
            return ServiceAttributesSchema;
        default:
            return PhysicalAttributesSchema;
    }
}

const skuSchema = upperCodeField(SKU_MAX, SKU_MIN);

const CommonProductFields = {
    projectId: idSchema,
    categoryId: z.nullish(idSchema),
    type: z.optional(z.enum(PRODUCT_TYPE_VALUES)),
    name: textField(LABEL_MAX),
    slug: z.optional(slugField(SLUG_MAX)),
    sku: skuSchema,
    description: z.nullish(z.string().check(z.maxLength(TEXT_MAX))),
    price: z.int().check(z.gte(0)),
    currency: z.optional(z.enum(CURRENCY_VALUES)),
    status: z.optional(z.enum(PRODUCT_STATUS_VALUES)),
    images: z.optional(
        z.array(imageUrlField).check(z.maxLength(IMAGES_PER_ENTITY_MAX)),
    ),
    badges: z.optional(
        z
            .array(
                z
                    .string()
                    .check(
                        z.trim(),
                        z.toLowerCase(),
                        z.maxLength(CODE_MAX),
                        z.regex(LOWER_CODE_PATTERN),
                    ),
            )
            .check(z.maxLength(PRODUCT_BADGE_MAX)),
    ),
    attributes: z.optional(z.record(z.string(), z.unknown())),
    performerIds: z.optional(
        z.array(idSchema).check(z.maxLength(PAGE_SIZE_DEFAULT)),
    ),
    isFeatured: z.optional(z.boolean()),
    stock: z.nullish(z.int().check(z.gte(0))),
    options: z.optional(
        z
            .array(
                z.object({
                    name: z
                        .string()
                        .check(
                            z.trim(),
                            z.minLength(1),
                            z.maxLength(TITLE_MAX),
                        ),
                    values: z
                        .array(
                            z
                                .string()
                                .check(
                                    z.trim(),
                                    z.minLength(1),
                                    z.maxLength(TITLE_MAX),
                                ),
                        )
                        .check(
                            z.minLength(1),
                            z.maxLength(PRODUCT_OPTION_VALUES_MAX),
                        ),
                }),
            )
            .check(z.maxLength(PRODUCT_OPTIONS_MAX)),
    ),
    variants: z.optional(
        z.array(
            z.object({
                id: z.optional(z.string()),
                optionValues: z.record(z.string(), z.string()),

                sku: z.nullable(optionalText(skuSchema)),
                price: z.nullish(z.int().check(z.gte(0))),
                stock: z.nullish(z.int().check(z.gte(0))),
                isActive: z.optional(z.boolean()),
                position: z.optional(z.int().check(z.gte(0))),
            }),
        ),
    ),
};

export const CreateProductActionInputSchema = z.object(CommonProductFields);
export type CreateProductInput = z.infer<typeof CreateProductActionInputSchema>;

export const UpdateProductActionInputSchema = z.extend(
    z.omit(CreateProductActionInputSchema, { stock: true }),
    { id: idSchema },
);

export const DeleteProductActionInputSchema = entityInProjectSchema;

export const ProductsActionInputSchema = z.object({
    projectId: idSchema,
    search: z.optional(z.string().check(z.maxLength(LABEL_MAX))),
});

export function parseProductAttributes(
    type: ProductType,
    attributes: Record<string, unknown> | undefined,
): Record<string, unknown> {
    const result = attributesSchemaFor(type).safeParse(attributes ?? {});

    if (!result.success) {
        const reason = result.error.issues
            .map((issue) => `${issue.path.join('.') || '·'}: ${issue.message}`)
            .join('; ');

        throw new ApplicationError(
            `Атрибуты не подходят к типу «${type}»: ${reason}`,
        );
    }

    return result.data;
}
