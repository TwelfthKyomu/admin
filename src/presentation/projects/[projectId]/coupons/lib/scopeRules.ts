import type { CouponScopeRule } from '@/contexts/coupon';
import type { ProductView } from '@/contexts/product';
import type { ProjectCategoryView } from '@/contexts/projectCategory';

export const ruleTargetId = (rule: CouponScopeRule): string => {
    return rule.type === 'product' ? rule.productId : rule.categoryId;
};

export const scopeRuleLabel = (
    rule: CouponScopeRule,
    categories: ProjectCategoryView[],
    products: ProductView[],
): string => {
    if (rule.type === 'category') {
        const name = categories.find(
            (category) => category.id === rule.categoryId,
        )?.name;

        return `Категория: ${name ?? 'удалена'}`;
    }

    const name = products.find(
        (product) => product.id === rule.productId,
    )?.name;

    return `Товар: ${name ?? 'удалён'}`;
};
