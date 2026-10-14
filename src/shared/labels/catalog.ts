import { createOptions } from '@/shared/lib/createOptions';
import type { BadgeVariant } from '@/shared/types';
import {
    COUPON_DISCOUNT_TYPE_VALUES,
    COUPON_STATUS_VALUES,
    CouponDiscountType,
    CouponStatus,
} from '@/contexts/coupon';
import {
    PRODUCT_STATUS_VALUES,
    PRODUCT_TYPE_VALUES,
    ProductStatus,
    ProductType,
} from '@/contexts/product';
import {
    PROJECT_CATEGORY_TYPE_VALUES,
    ProjectCategoryType,
} from '@/contexts/projectCategory';
import { StockMovementReason } from '@/contexts/stockMovement';

export const PRODUCT_TYPE_LABEL: Record<ProductType, string> = {
    [ProductType.PHYSICAL]: 'Продукт',
    [ProductType.SERVICE]: 'Услуга',
};

export const PRODUCT_TYPE_OPTIONS = createOptions(
    PRODUCT_TYPE_VALUES,
    PRODUCT_TYPE_LABEL,
);

export const PRODUCT_STATUS_LABEL: Record<ProductStatus, string> = {
    [ProductStatus.DRAFT]: 'Черновик',
    [ProductStatus.ACTIVE]: 'Активен',
    [ProductStatus.UNLISTED]: 'По ссылке',
    [ProductStatus.ARCHIVED]: 'Архив',
};

export const PRODUCT_STATUS_OPTIONS = createOptions(
    PRODUCT_STATUS_VALUES,
    PRODUCT_STATUS_LABEL,
);

export const PROJECT_CATEGORY_TYPE_LABEL: Record<ProjectCategoryType, string> =
    {
        [ProjectCategoryType.PRODUCT]: 'Товары',
        [ProjectCategoryType.SERVICE]: 'Услуги',
        [ProjectCategoryType.GENERIC]: 'Общее',
    };

export const PROJECT_CATEGORY_TYPE_OPTIONS = createOptions(
    PROJECT_CATEGORY_TYPE_VALUES,
    PROJECT_CATEGORY_TYPE_LABEL,
);

const COUPON_DISCOUNT_TYPE_LABEL: Record<CouponDiscountType, string> = {
    [CouponDiscountType.PERCENTAGE]: 'Процент',
    [CouponDiscountType.FIXED_AMOUNT]: 'Фикс. сумма',
};

export const COUPON_DISCOUNT_TYPE_OPTIONS = createOptions(
    COUPON_DISCOUNT_TYPE_VALUES,
    COUPON_DISCOUNT_TYPE_LABEL,
);

export const COUPON_STATUS_LABEL: Record<CouponStatus, string> = {
    [CouponStatus.ACTIVE]: 'Активен',
    [CouponStatus.INACTIVE]: 'Выключен',
};

export const COUPON_STATUS_VARIANT: Record<CouponStatus, BadgeVariant> = {
    [CouponStatus.ACTIVE]: 'default',
    [CouponStatus.INACTIVE]: 'outline',
};

export const COUPON_STATUS_OPTIONS = createOptions(
    COUPON_STATUS_VALUES,
    COUPON_STATUS_LABEL,
);

export const STOCK_MOVEMENT_REASON_LABEL: Record<StockMovementReason, string> =
    {
        [StockMovementReason.SALE]: 'Продажа',
        [StockMovementReason.RETURN]: 'Возврат',
        [StockMovementReason.MANUAL]: 'Корректировка',
        [StockMovementReason.WRITE_OFF]: 'Списание',
    };
