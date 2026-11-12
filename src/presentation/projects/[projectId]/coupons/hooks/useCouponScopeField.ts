'use client';

import { useController, useFormContext } from 'react-hook-form';
import {
    COUPON_SCOPE_RULES_MAX,
    type CouponScopeRule,
} from '@/contexts/coupon';
import { useProductsList } from '@/contexts/product';
import { useCategoriesList } from '@/contexts/projectCategory';
import type { CreateCouponFormValues } from '../form/formData';
import { ruleTargetId, scopeRuleLabel } from '../lib/scopeRules';

export const useCouponScopeField = (projectId: string) => {
    const { control } = useFormContext<CreateCouponFormValues>();

    const {
        field,
        fieldState: { error, invalid },
    } = useController({ name: 'scope.rules', control });

    const categories =
        useCategoriesList({ projectId, includeInactive: true }).data ?? [];

    const products = useProductsList({ projectId }).data ?? [];

    const rules = field.value ?? [];
    const selectedIds = new Set(rules.map(ruleTargetId));

    const ruleItems = rules.map((rule) => ({
        id: ruleTargetId(rule),
        label: scopeRuleLabel(rule, categories, products),
    }));

    const categoryOptions = categories
        .filter((category) => !selectedIds.has(category.id))
        .map((category) => ({ value: category.id, label: category.name }));

    const productOptions = products
        .filter((product) => !selectedIds.has(product.id))
        .map((product) => ({
            value: product.id,
            label: product.name,
            keywords: product.sku ? [product.sku] : undefined,
        }));

    const addRule = (rule: CouponScopeRule) => field.onChange([...rules, rule]);

    const removeRule = (targetId: string) =>
        field.onChange(rules.filter((rule) => ruleTargetId(rule) !== targetId));

    return {
        ruleItems,
        canAdd: rules.length < COUPON_SCOPE_RULES_MAX,
        categoryOptions,
        productOptions,
        addRule,
        removeRule,
        error,
        invalid,
    };
};
