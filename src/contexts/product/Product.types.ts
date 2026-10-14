import { ApplicationError } from '@/shared/api/errors';
import { CODE_MAX } from '@/shared/constants/default';
import { enumValues } from '@/shared/lib/enum';
import { normalizeCode } from '@/shared/validation';
import { ProjectCategoryType } from '@/contexts/projectCategory/ProjectCategory.types';
import type { CreateProductInput } from './Product.schema';
import type {
    NewProductVariantRecord,
    ProductRecord,
    ProductVariantRecord,
} from './Products.table';

export const ProductType = {
    PHYSICAL: 'physical',
    SERVICE: 'service',
} as const;

export type ProductType = (typeof ProductType)[keyof typeof ProductType];

export const PRODUCT_TYPE_VALUES = enumValues(ProductType);

export function toProductType(value: string): ProductType {
    switch (value) {
        case ProductType.SERVICE:
            return ProductType.SERVICE;
        default:
            return ProductType.PHYSICAL;
    }
}

export const ProductStatus = {
    DRAFT: 'draft',
    ACTIVE: 'active',
    UNLISTED: 'unlisted',
    ARCHIVED: 'archived',
} as const;

export type ProductStatus = (typeof ProductStatus)[keyof typeof ProductStatus];

export const PRODUCT_STATUS_VALUES = enumValues(ProductStatus);

export const SELLABLE_PRODUCT_STATUSES: ProductStatus[] = [
    ProductStatus.ACTIVE,
    ProductStatus.UNLISTED,
];

export const PRODUCT_BADGE_MAX = 5;

function normalizeProductBadge(value: string): string | null {
    return normalizeCode(value, CODE_MAX);
}

export function normalizeProductBadges(badges: string[]): string[] {
    return [
        ...new Set(
            badges.flatMap((badge) => normalizeProductBadge(badge) ?? []),
        ),
    ];
}

export interface ProductOption {
    name: string;
    values: string[];
}

export const PRODUCT_OPTIONS_MAX = 3;
export const PRODUCT_OPTION_VALUES_MAX = 50;

export function normalizeProductOptions(
    options: ProductOption[],
): ProductOption[] {
    const result: ProductOption[] = [];

    for (const option of options) {
        const name = option.name.trim();

        if (!name) continue;

        const values = Array.from(
            new Set(option.values.map((value) => value.trim()).filter(Boolean)),
        );

        if (values.length === 0) continue;

        result.push({ name, values });
    }

    return result;
}

export function defaultAttributesFor(
    type: ProductType,
): Record<string, unknown> {
    switch (type) {
        case ProductType.SERVICE:
            return {
                durationMinutes: 60,
                bookable: true,
                bufferMinutes: 0,
            };
        default:
            return { weightGrams: null };
    }
}

export const EDITION_SIZE_DEFAULT = 100;

export function editionSizeOf(
    attributes: Readonly<Record<string, unknown>>,
): number | undefined {
    const size = attributes.editionSize;

    return typeof size === 'number' && size > 0 ? size : undefined;
}

const COMPATIBLE_CATEGORY_TYPES: Record<ProductType, ProjectCategoryType[]> = {
    [ProductType.PHYSICAL]: [
        ProjectCategoryType.PRODUCT,
        ProjectCategoryType.GENERIC,
    ],
    [ProductType.SERVICE]: [
        ProjectCategoryType.SERVICE,
        ProjectCategoryType.GENERIC,
    ],
};

export function isCategoryCompatible(
    productType: ProductType,
    categoryType: ProjectCategoryType,
): boolean {
    return COMPATIBLE_CATEGORY_TYPES[productType].includes(categoryType);
}

export function buildVariantCombinations(
    options: ProductOption[],
): Record<string, string>[] {
    const normalized = normalizeProductOptions(options);

    if (normalized.length === 0) return [];

    let combos: Record<string, string>[] = [{}];

    for (const option of normalized) {
        const next: Record<string, string>[] = [];

        for (const combo of combos) {
            for (const value of option.values) {
                next.push({ ...combo, [option.name]: value });
            }
        }

        combos = next;
    }

    return combos;
}

export function variantComboKey(optionValues: Record<string, string>): string {
    return Object.entries(optionValues)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([name, value]) => `${name}=${value}`)
        .join('|');
}

export function variantComboLabel(
    optionValues: Record<string, string>,
): string {
    return Object.values(optionValues).join(' / ');
}

export type ProductRef = Pick<ProductRecord, 'id' | 'projectId'>;

type VariantInput = NonNullable<CreateProductInput['variants']>[number];

export function buildVariantRecords(
    product: ProductRef,
    inputs: VariantInput[],
): NewProductVariantRecord[] {
    const seenCombos = new Set<string>();

    return inputs.map((input, index) => {
        const optionValues = Object.fromEntries(
            Object.entries(input.optionValues)
                .map(([name, value]) => [name.trim(), value.trim()])
                .filter(([name, value]) => name && value),
        );

        if (Object.keys(optionValues).length === 0) {
            throw new ApplicationError(
                'У варианта должно быть хотя бы одно значение опции',
            );
        }

        const combo = variantComboKey(optionValues);

        if (seenCombos.has(combo)) {
            throw new ApplicationError(
                `Повторяющаяся комбинация варианта: ${combo}`,
            );
        }

        seenCombos.add(combo);

        return {
            id: input.id,
            productId: product.id,
            projectId: product.projectId,
            optionValues,
            sku: input.sku ?? null,
            price: input.price ?? null,
            stock: input.stock ?? null,
            isActive: input.isActive ?? true,
            position: input.position ?? index,
        };
    });
}

export function assertVariantIdsOwned(
    variants: NewProductVariantRecord[],
    existing: ProductVariantRecord[],
): void {
    const ownIds = new Set(existing.map((variant) => variant.id));

    if (variants.some((variant) => variant.id && !ownIds.has(variant.id))) {
        throw new ApplicationError('Вариант не найден у этого товара');
    }
}

export function assertVariantsMatchOptions(
    options: ProductOption[],
    variants: Pick<ProductVariantRecord, 'optionValues'>[],
): void {
    if (variants.length === 0) return;
    if (options.length === 0) {
        throw new ApplicationError(
            'Для вариантов нужно сначала задать опции товара',
        );
    }

    for (const variant of variants) {
        if (Object.keys(variant.optionValues).length !== options.length) {
            throw new ApplicationError(
                'Вариант должен задавать значение для каждой опции товара',
            );
        }

        for (const option of options) {
            const value = variant.optionValues[option.name];

            if (!value) {
                throw new ApplicationError(
                    `У варианта нет значения для опции «${option.name}»`,
                );
            }
            if (!option.values.includes(value)) {
                throw new ApplicationError(
                    `«${value}» — недопустимое значение опции «${option.name}»`,
                );
            }
        }
    }
}
